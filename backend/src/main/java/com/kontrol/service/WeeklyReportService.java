package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.WeeklyReportDto;
import com.kontrol.model.PostPlatform;
import com.kontrol.model.Project;
import com.kontrol.model.WeeklyReport;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.ProjectRepository;
import com.kontrol.repository.WeeklyReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final PostPlatformRepository postPlatformRepository;
    private final ProjectRepository projectRepository;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;

    public WeeklyReportDto getWeeklyReport(UUID projectId) {
        LocalDate mondayOfCurrentWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        OffsetDateTime since = OffsetDateTime.now().minusHours(24);

        var cached = weeklyReportRepository.findByProjectIdAndWeekOfAndRecent(projectId, mondayOfCurrentWeek, since);
        if (cached.isPresent()) {
            return toDto(cached.get());
        }

        return generateAndSave(projectId, mondayOfCurrentWeek);
    }

    public List<WeeklyReportDto> getAllReports(UUID projectId) {
        return weeklyReportRepository.findByProjectIdOrderByWeekOfDesc(projectId)
            .stream().map(this::toDto).toList();
    }

    // Every Monday at 9am UTC
    @Scheduled(cron = "0 0 9 * * MON")
    public void generateWeeklyReportsForAllProjects() {
        log.info("Running weekly report generation for all active projects");
        List<Project> projects = projectRepository.findAll();
        LocalDate mondayOfCurrentWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (Project project : projects) {
            if (!project.isActive()) continue;
            try {
                generateAndSave(project.getId(), mondayOfCurrentWeek);
                log.info("Weekly report generated for project {}", project.getName());
            } catch (Exception e) {
                log.error("Failed to generate weekly report for project {}: {}", project.getId(), e.getMessage(), e);
            }
        }
    }

    private WeeklyReportDto generateAndSave(UUID projectId, LocalDate weekOf) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String pid = projectId.toString();

        // This week stats
        OffsetDateTime weekStart = weekOf.atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime weekEnd = weekStart.plusDays(7);
        OffsetDateTime priorWeekStart = weekStart.minusDays(7);

        int thisWeekPosts = postPlatformRepository.countPublishedByProjectSince(pid, weekStart);
        int priorWeekPosts = postPlatformRepository.countPublishedByProjectSince(pid, priorWeekStart) - thisWeekPosts;
        double vsLastWeek = priorWeekPosts > 0 ? ((double)(thisWeekPosts - priorWeekPosts) / priorWeekPosts) * 100.0 : 0.0;

        // Best post this week
        List<PostPlatform> weekPosts = postPlatformRepository.findByProjectOrderByPerformance(pid, 1);
        PostPlatform topPost = weekPosts.isEmpty() ? null : weekPosts.get(0);

        // Platform breakdown
        Map<String, Object> breakdown = buildPlatformBreakdown(pid);

        // Build totals
        long totalEngagement = calculateTotalEngagement(pid);

        // Claude summary
        String claudeSummary = "Weekly report generated successfully.";
        List<String> recommendations = List.of("Keep posting consistently", "Engage with your audience", "Try new content formats");

        try {
            var claudeResult = generateClaudeSummary(project, thisWeekPosts, priorWeekPosts, vsLastWeek, breakdown);
            claudeSummary = claudeResult.get("summary");
            String recsJson = claudeResult.get("recommendations");
            if (recsJson != null) {
                JsonNode recsNode = objectMapper.readTree(recsJson);
                List<String> parsedRecs = new ArrayList<>();
                if (recsNode.isArray()) {
                    for (JsonNode n : recsNode) parsedRecs.add(n.asText());
                }
                if (!parsedRecs.isEmpty()) recommendations = parsedRecs;
            }
        } catch (Exception e) {
            log.warn("Claude weekly summary failed: {}", e.getMessage());
        }

        String recsJson;
        try {
            recsJson = objectMapper.writeValueAsString(recommendations);
        } catch (Exception e) {
            recsJson = "[]";
        }

        String breakdownJson;
        try {
            breakdownJson = objectMapper.writeValueAsString(breakdown);
        } catch (Exception e) {
            breakdownJson = "{}";
        }

        WeeklyReport report = WeeklyReport.builder()
            .projectId(projectId)
            .weekOf(weekOf)
            .postsPublished(thisWeekPosts)
            .postsPlanned(0)
            .totalEngagement(totalEngagement)
            .vsLastWeek(vsLastWeek)
            .topPostContent(topPost != null && topPost.getContent() != null
                ? topPost.getContent().substring(0, Math.min(topPost.getContent().length(), 100)) : null)
            .topPostPlatform(topPost != null ? topPost.getPlatform() : null)
            .topPostScore(topPost != null && topPost.getPerformanceScore() != null
                ? topPost.getPerformanceScore().doubleValue() : 0.0)
            .claudeSummary(claudeSummary)
            .recommendations(recsJson)
            .platformBreakdown(breakdownJson)
            .build();

        return toDto(weeklyReportRepository.save(report));
    }

    private Map<String, String> generateClaudeSummary(Project project, int thisWeek, int lastWeek, double vsLastWeek, Map<String, Object> breakdown) {
        String systemPrompt = "You are a social media performance analyst. Return valid JSON with keys: \"summary\" (2-3 sentence paragraph), \"recommendations\" (JSON array of 3-5 plain strings). No markdown fences.";

        StringBuilder userMsg = new StringBuilder();
        userMsg.append("Project: ").append(project.getName()).append("\n");
        userMsg.append("This week posts: ").append(thisWeek).append("\n");
        userMsg.append("Last week posts: ").append(lastWeek).append("\n");
        userMsg.append("Week-over-week change: ").append(String.format("%.1f%%", vsLastWeek)).append("\n");
        userMsg.append("Platform breakdown: ").append(breakdown).append("\n");
        userMsg.append("Generate a weekly performance summary and 3-5 actionable recommendations.");

        String response = claudeService.callClaudeRaw(systemPrompt, userMsg.toString(), 768);
        try {
            String cleaned = response.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            JsonNode root = objectMapper.readTree(cleaned);
            Map<String, String> result = new HashMap<>();
            result.put("summary", root.path("summary").asText("Good week of content creation!"));
            result.put("recommendations", root.path("recommendations").toString());
            return result;
        } catch (Exception e) {
            return Map.of("summary", response, "recommendations", "[]");
        }
    }

    private Map<String, Object> buildPlatformBreakdown(String projectId) {
        Map<String, Object> breakdown = new LinkedHashMap<>();
        List<String> platforms = List.of("IG", "TT", "LI", "RD", "X", "FB", "YT");
        for (String platform : platforms) {
            int count = postPlatformRepository.countPublishedByProjectAndPlatform(projectId, platform);
            if (count > 0) {
                breakdown.put(platform, count);
            }
        }
        return breakdown;
    }

    private long calculateTotalEngagement(String projectId) {
        List<PostPlatform> posts = postPlatformRepository.findByProjectOrderByPerformance(projectId, 100);
        return posts.stream()
            .mapToLong(p -> (p.getLikes() != null ? p.getLikes() : 0)
                + (p.getComments() != null ? p.getComments() : 0)
                + (p.getShares() != null ? p.getShares() : 0))
            .sum();
    }

    private WeeklyReportDto toDto(WeeklyReport r) {
        WeeklyReportDto.TopPost topPost = null;
        if (r.getTopPostPlatform() != null) {
            topPost = WeeklyReportDto.TopPost.builder()
                .content(r.getTopPostContent())
                .platform(r.getTopPostPlatform())
                .score(r.getTopPostScore() != null ? r.getTopPostScore() : 0.0)
                .build();
        }

        List<String> recommendations = List.of();
        try {
            if (r.getRecommendations() != null) {
                JsonNode arr = objectMapper.readTree(r.getRecommendations());
                List<String> recs = new ArrayList<>();
                if (arr.isArray()) {
                    for (JsonNode n : arr) recs.add(n.asText());
                }
                recommendations = recs;
            }
        } catch (Exception ignored) {}

        Map<String, Object> breakdown = new LinkedHashMap<>();
        try {
            if (r.getPlatformBreakdown() != null) {
                JsonNode node = objectMapper.readTree(r.getPlatformBreakdown());
                node.fields().forEachRemaining(e -> breakdown.put(e.getKey(), e.getValue().asInt()));
            }
        } catch (Exception ignored) {}

        return WeeklyReportDto.builder()
            .reportId(r.getId().toString())
            .weekOf(r.getWeekOf())
            .postsPublished(r.getPostsPublished() != null ? r.getPostsPublished() : 0)
            .postsPlanned(r.getPostsPlanned() != null ? r.getPostsPlanned() : 0)
            .totalEngagement(r.getTotalEngagement() != null ? r.getTotalEngagement() : 0L)
            .vsLastWeek(r.getVsLastWeek() != null ? r.getVsLastWeek() : 0.0)
            .topPost(topPost)
            .claudeSummary(r.getClaudeSummary())
            .recommendations(recommendations)
            .platformBreakdown(breakdown)
            .build();
    }
}
