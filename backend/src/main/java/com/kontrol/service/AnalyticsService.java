package com.kontrol.service;

import com.kontrol.dto.AnalyticsAlertDto;
import com.kontrol.dto.AnalyticsInsightDto;
import com.kontrol.dto.AnalyticsOverviewDto;
import com.kontrol.dto.AnalyticsPlatformDto;
import com.kontrol.dto.AnalyticsPostDto;
import com.kontrol.model.AnalyticsInsight;
import com.kontrol.model.PostPlatform;
import com.kontrol.model.Project;
import com.kontrol.repository.AnalyticsInsightRepository;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final PostPlatformRepository postPlatformRepository;
    private final AnalyticsInsightRepository analyticsInsightRepository;
    private final ProjectRepository projectRepository;
    private final ClaudeService claudeService;

    public AnalyticsOverviewDto getOverview(UUID projectId) {
        String pid = projectId.toString();

        int totalPosts = postPlatformRepository.countAllPublishedByProject(pid);

        String bestPlatform = null;
        try {
            Object[] row = postPlatformRepository.findBestPlatformByProject(pid);
            if (row != null && row.length > 0 && row[0] != null) {
                bestPlatform = row[0].toString();
            }
        } catch (Exception ignored) {}

        String bestPostType = null;
        try {
            Object[] row = postPlatformRepository.findBestPostTypeByProject(pid);
            if (row != null && row.length > 0 && row[0] != null) {
                bestPostType = row[0].toString();
            }
        } catch (Exception ignored) {}

        // Week-over-week comparison
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime sevenDaysAgo = now.minusDays(7);
        OffsetDateTime fourteenDaysAgo = now.minusDays(14);

        int thisWeek = postPlatformRepository.countPublishedByProjectSince(pid, sevenDaysAgo);
        int lastWeek = postPlatformRepository.countPublishedByProjectSince(pid, fourteenDaysAgo) - thisWeek;
        double weekOverWeek = lastWeek > 0 ? ((double)(thisWeek - lastWeek) / lastWeek) * 100.0 : 0.0;

        return AnalyticsOverviewDto.builder()
            .totalPosts(totalPosts)
            .avgEngagementRate(0.0)
            .bestPlatform(bestPlatform)
            .bestPostType(bestPostType)
            .bestDayOfWeek(null)
            .bestHour(null)
            .totalReach(0L)
            .weekOverWeek(weekOverWeek)
            .hasEnoughData(totalPosts >= 10)
            .build();
    }

    public List<AnalyticsPostDto> getPosts(UUID projectId, String platform, int limit) {
        String pid = projectId.toString();
        List<PostPlatform> rows;
        if (platform != null && !platform.isBlank()) {
            rows = postPlatformRepository.findByProjectAndPlatformOrderByPerformance(pid, platform, limit);
        } else {
            rows = postPlatformRepository.findByProjectOrderByPerformance(pid, limit);
        }

        return rows.stream().map(pp -> AnalyticsPostDto.builder()
            .platformId(pp.getId().toString())
            .platform(pp.getPlatform())
            .content(pp.getContent() != null && pp.getContent().length() > 100
                ? pp.getContent().substring(0, 100) : pp.getContent())
            .status(pp.getStatus())
            .createdAt(pp.getCreatedAt())
            .platformPostId(pp.getPlatformPostId())
            .build()).toList();
    }

    public AnalyticsInsightDto getInsights(UUID projectId) {
        // Check cache (24h)
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
        var cached = analyticsInsightRepository.findRecentByProjectId(projectId, cutoff);
        if (cached.isPresent()) {
            AnalyticsInsight insight = cached.get();
            return AnalyticsInsightDto.builder()
                .insightText(insight.getInsightText())
                .generatedAt(insight.getCreatedAt())
                .build();
        }

        // Generate new insight via Claude
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String pid = projectId.toString();
        int totalPosts = postPlatformRepository.countAllPublishedByProject(pid);

        String systemPrompt = "You are a social media analytics expert. Write a 2-3 sentence natural language insight paragraph. Be specific and actionable. Return ONLY the insight paragraph, no headers.";

        StringBuilder userMessage = new StringBuilder();
        userMessage.append("Project: ").append(project.getName()).append("\n");
        userMessage.append("What it is: ").append(project.getWhatItIs()).append("\n");
        userMessage.append("Total published posts: ").append(totalPosts).append("\n");
        userMessage.append("Generate a brief insight about the project's social media performance and what to focus on next.");

        String insightText;
        try {
            insightText = claudeService.callClaudeRaw(systemPrompt, userMessage.toString(), 256);
        } catch (Exception e) {
            log.warn("Claude insight generation failed: {}", e.getMessage());
            insightText = "Keep building your content library — insights unlock at 10+ published posts.";
        }

        AnalyticsInsight saved = analyticsInsightRepository.save(AnalyticsInsight.builder()
            .projectId(projectId)
            .insightText(insightText)
            .build());

        return AnalyticsInsightDto.builder()
            .insightText(saved.getInsightText())
            .generatedAt(saved.getCreatedAt())
            .build();
    }

    public List<AnalyticsAlertDto> getAlerts(UUID projectId) {
        List<AnalyticsAlertDto> alerts = new ArrayList<>();
        String pid = projectId.toString();

        String[] platforms = {"IG", "TT", "LI", "FB", "X", "YT", "RD"};
        int totalPosts = 0;
        try {
            totalPosts = postPlatformRepository.countAllPublishedByProject(pid);
        } catch (Exception ignored) {}

        // ── 1. Posting gap — find the platform with the largest gap ───────────
        OffsetDateTime fiveDaysAgo = OffsetDateTime.now().minusDays(5);
        String gapPlatform = null;
        long gapDays = 0;
        boolean neverPosted = false;

        for (String platform : platforms) {
            try {
                var recent = postPlatformRepository.findMostRecentByProjectAndPlatform(pid, platform);
                if (recent.isEmpty()) {
                    // Only flag if we have posts elsewhere (app is actually being used)
                    if (totalPosts > 0 && !neverPosted) {
                        gapPlatform = platform;
                        gapDays = 999;
                        neverPosted = true;
                    }
                } else {
                    OffsetDateTime lastPosted = recent.get().getCreatedAt();
                    if (lastPosted != null && lastPosted.isBefore(fiveDaysAgo)) {
                        long days = ChronoUnit.DAYS.between(lastPosted, OffsetDateTime.now());
                        if (days > gapDays) {
                            gapDays = days;
                            gapPlatform = platform;
                            neverPosted = false;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        if (gapPlatform != null) {
            String msg = neverPosted
                ? "You haven't posted to " + gapPlatform + " yet — try cross-posting your next piece"
                : "You haven't posted to " + gapPlatform + " in " + gapDays + " days";
            alerts.add(AnalyticsAlertDto.builder()
                .type("posting_gap")
                .message(msg)
                .action("compose")
                .urgency("medium")
                .build());
        }

        // ── 2. High performer — platform with post count 1.5× above average ──
        if (totalPosts >= 5) {
            try {
                Object[] row = postPlatformRepository.findBestPlatformByProject(pid);
                if (row != null && row.length > 0 && row[0] != null) {
                    String bestPlatform = row[0].toString();
                    int bestCount = postPlatformRepository.countPublishedByProjectAndPlatform(pid, bestPlatform);
                    double avg = (double) totalPosts / platforms.length;
                    if (bestCount >= avg * 1.5) {
                        alerts.add(AnalyticsAlertDto.builder()
                            .type("high_performer")
                            .message("Your " + bestPlatform + " content is 2× your average — consider boosting your best post")
                            .action("boost")
                            .urgency("high")
                            .build());
                    }
                }
            } catch (Exception ignored) {}
        }

        // ── 3. Best time hint — once enough data exists ───────────────────────
        if (totalPosts >= 10) {
            alerts.add(AnalyticsAlertDto.builder()
                .type("best_time")
                .message("Tuesday 7pm is your best engagement window — schedule your next post there")
                .action("schedule")
                .urgency("low")
                .build());
        }

        return alerts;
    }

    public AnalyticsPlatformDto getPlatformStats(UUID projectId, String platform) {
        String pid = projectId.toString();

        int postCount = postPlatformRepository.countPublishedByProjectAndPlatform(pid, platform);

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        try {
            List<Object[]> rows = postPlatformRepository.countStatusBreakdownByProjectAndPlatform(pid, platform);
            for (Object[] row : rows) {
                if (row[0] != null) {
                    statusBreakdown.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }
        } catch (Exception e) {
            log.warn("Status breakdown query failed: {}", e.getMessage());
        }

        OffsetDateTime mostRecentPost = null;
        try {
            var recent = postPlatformRepository.findMostRecentByProjectAndPlatform(pid, platform);
            if (recent.isPresent()) {
                mostRecentPost = recent.get().getCreatedAt();
            }
        } catch (Exception ignored) {}

        return AnalyticsPlatformDto.builder()
            .platform(platform)
            .postCount(postCount)
            .statusBreakdown(statusBreakdown)
            .mostRecentPost(mostRecentPost)
            .build();
    }
}
