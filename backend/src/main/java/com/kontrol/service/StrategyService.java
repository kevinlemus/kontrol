package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.StrategySuggestionDto;
import com.kontrol.dto.WeeklyPlanDto;
import com.kontrol.model.PlatformConfig;
import com.kontrol.model.Project;
import com.kontrol.model.StrategyCache;
import com.kontrol.repository.PlatformConfigRepository;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.ProjectRepository;
import com.kontrol.repository.StrategyCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class StrategyService {

    private final ProjectRepository projectRepository;
    private final StrategyCacheRepository strategyCacheRepository;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;
    private final PostPlatformRepository postPlatformRepository;
    private final PlatformConfigRepository platformConfigRepository;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public StrategySuggestionDto getSuggestions(UUID projectId) {
        ContentMixAnalysis mix = analyzeContentMix(projectId);
        String calendarContext = buildContentCalendarContext(mix);

        // Check 24h cache — but cache key now includes a hash of the mix so stale
        // calendar data always re-generates. Simplest: bypass cache when mix data exists.
        if (mix.totalTyped() == 0 && mix.totalPosts() == 0) {
            // No posts yet — check cache as before
            OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
            var cached = strategyCacheRepository.findRecentByProjectId(projectId, cutoff);
            if (cached.isPresent()) {
                StrategySuggestionDto dto = parseSuggestions(cached.get().getSuggestions());
                enrichWithMixData(dto, mix);
                return dto;
            }
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String systemPrompt = buildSystemPrompt(calendarContext);
        String userMessage = buildUserMessage(project);

        String responseText;
        try {
            responseText = claudeService.callClaudeRaw(systemPrompt, userMessage, 2048);
        } catch (Exception e) {
            log.error("Claude strategy generation failed: {}", e.getMessage(), e);
            StrategySuggestionDto empty = StrategySuggestionDto.builder().suggestions(List.of()).build();
            enrichWithMixData(empty, mix);
            return empty;
        }

        String cleaned = cleanJson(responseText);
        strategyCacheRepository.save(StrategyCache.builder()
            .projectId(projectId)
            .suggestions(cleaned)
            .build());

        StrategySuggestionDto dto = parseSuggestions(cleaned);
        enrichWithMixData(dto, mix);
        return dto;
    }

    public WeeklyPlanDto generateWeeklyPlan(UUID projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        ContentMixAnalysis mix = analyzeContentMix(projectId);
        String calendarContext = buildContentCalendarContext(mix);

        // Build enabled platforms string
        List<PlatformConfig> configs = platformConfigRepository.findByProjectId(projectId);
        String enabledPlatforms = configs.stream()
            .filter(PlatformConfig::isEnabled)
            .map(PlatformConfig::getPlatform)
            .reduce((a, b) -> a + ", " + b)
            .orElse("IG, TT, LI, FB, X");

        // Determine Monday of current week as day-0
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        StringBuilder dayLabels = new StringBuilder();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            String label = day.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            dayLabels.append(i).append("=").append(label).append("(").append(day).append(")");
            if (i < 6) dayLabels.append(", ");
        }

        String systemPrompt = """
            You are a social media content calendar expert.
            Return ONLY a valid JSON array of exactly 7 objects. No markdown fences, no explanation.
            Each object must have these exact keys:
            {
              "dayIndex": 0,
              "dayLabel": "Monday",
              "platform": "ig",
              "contentType": "tip",
              "topic": "short topic description",
              "suggestedPrompt": "what to write in the generate box"
            }
            Platform codes: ig=Instagram, tt=TikTok, li=LinkedIn, rd=Reddit, x=X/Twitter, fb=Facebook, yt=YouTube, st=Steam, it=itch.io, gj=GameJolt
            Content types: before_after, tip, promotional, testimonial, behind_scenes, announcement, engagement, other
            Best posting times for reference: Instagram 7pm, TikTok 6pm, LinkedIn 8am, Facebook 2pm
            Spread platforms across the week — do not repeat the same platform two days in a row.
            Follow the content mix rules strictly.
            """;

        String userMessage = "Project: " + project.getName() + "\n"
            + (project.getWhatItIs() != null ? "What it is: " + project.getWhatItIs() + "\n" : "")
            + (project.getWhoItsFor() != null ? "Audience: " + project.getWhoItsFor() + "\n" : "")
            + (project.getCurrentStatus() != null ? "Status: " + project.getCurrentStatus() + "\n" : "")
            + "Enabled platforms: " + enabledPlatforms + "\n"
            + "Week days (dayIndex: label): " + dayLabels + "\n"
            + calendarContext
            + "\nGenerate a 7-day content plan for this week.";

        String responseText;
        try {
            responseText = claudeService.callClaudeRaw(systemPrompt, userMessage, 2048);
        } catch (Exception e) {
            log.error("Claude weekly plan generation failed: {}", e.getMessage(), e);
            return WeeklyPlanDto.builder().days(List.of()).build();
        }

        return parseWeeklyPlan(responseText);
    }

    // -------------------------------------------------------------------------
    // Content mix analysis
    // -------------------------------------------------------------------------

    private record ContentMixAnalysis(
        Map<String, Long> counts,
        long totalTyped,
        List<String> recentTypes,
        Map<String, Double> avgScores,
        long totalPosts
    ) {}

    private ContentMixAnalysis analyzeContentMix(UUID projectId) {
        List<Object[]> typeCounts = postPlatformRepository.countByContentTypeForProject(projectId);
        Map<String, Long> counts = new HashMap<>();
        long totalTyped = 0;
        for (Object[] row : typeCounts) {
            String type = (String) row[0];
            long count = ((Number) row[1]).longValue();
            counts.put(type, count);
            totalTyped += count;
        }

        List<String> recent = postPlatformRepository.findRecentContentTypes(projectId, 3);

        List<Object[]> scoreRows = postPlatformRepository.avgScoreByContentType(projectId);
        Map<String, Double> avgScores = new HashMap<>();
        for (Object[] row : scoreRows) {
            avgScores.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        long totalPosts = postPlatformRepository.countPublishedLast30Days(projectId);

        return new ContentMixAnalysis(counts, totalTyped, recent, avgScores, totalPosts);
    }

    private String buildContentCalendarContext(ContentMixAnalysis mix) {
        StringBuilder sb = new StringBuilder();
        sb.append("\nRECENT CONTENT CALENDAR ANALYSIS (last 30 days):\n");

        long total = mix.totalTyped() > 0 ? mix.totalTyped() : 1;

        String[] types  = {"before_after", "tip", "promotional", "testimonial",
                           "behind_scenes", "announcement", "engagement", "other"};
        String[] labels = {"Before/after posts", "Tip/educational posts", "Promotional posts",
                           "Testimonial posts", "Behind-the-scenes posts", "Announcement posts",
                           "Engagement posts", "Other posts"};

        for (int i = 0; i < types.length; i++) {
            long count = mix.counts().getOrDefault(types[i], 0L);
            long pct   = count * 100 / total;
            sb.append("- ").append(labels[i]).append(": ").append(count)
              .append(" (").append(pct).append("% of total)\n");
        }
        sb.append("- Total posts last 30 days: ").append(mix.totalPosts()).append("\n");

        if (!mix.recentTypes().isEmpty()) {
            sb.append("Last ").append(mix.recentTypes().size()).append(" posts were: ");
            sb.append(String.join(", ", mix.recentTypes())).append("\n");
        }

        if (!mix.avgScores().isEmpty()) {
            sb.append("\nPERFORMANCE BY CONTENT TYPE:\n");
            mix.avgScores().forEach((type, score) ->
                sb.append("- ").append(type).append(": avg score ")
                  .append(String.format("%.1f", score)).append("\n"));
        }

        sb.append("""

            CONTENT MIX RULES (follow strictly):
            - Ideal mix: 60% value/educational, 20% social proof, 20% promotional
            - NEVER suggest the same content type as the most recent post as your #1 idea
            - If promotional > 25% this month, deprioritize promotional suggestions
            - If no testimonial content this month, include at least one testimonial suggestion
            - If before/after > 40% this month, suggest alternative formats
            - If 3 consecutive posts were the same type, your first suggestion MUST be a different type
            - Boost frequency of content types that score above average
            - Reduce frequency of content types that consistently underperform

            Based on this calendar analysis, suggest content that balances the mix and avoids repetition.
            """);

        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Enrich DTO with mix summary fields
    // -------------------------------------------------------------------------

    private void enrichWithMixData(StrategySuggestionDto dto, ContentMixAnalysis mix) {
        long total = mix.totalTyped() > 0 ? mix.totalTyped() : 1;

        // Build percents map
        Map<String, Double> percents = new LinkedHashMap<>();
        mix.counts().forEach((type, count) ->
            percents.put(type, Math.round(count * 1000.0 / total) / 10.0));

        dto.setContentMixCounts(mix.counts());
        dto.setContentMixPercents(percents);
        dto.setRecentTypes(mix.recentTypes());
        dto.setTotalPostsLast30Days(mix.totalPosts());

        // Compute mix warning
        String warning = computeMixWarning(mix, total);
        dto.setMixWarning(warning);
        dto.setMixBalanced(warning == null);
    }

    private String computeMixWarning(ContentMixAnalysis mix, long total) {
        // Check 3 consecutive same type first (highest priority)
        if (mix.recentTypes().size() == 3) {
            String first = mix.recentTypes().get(0);
            if (first.equals(mix.recentTypes().get(1)) && first.equals(mix.recentTypes().get(2))) {
                return "Your last 3 posts were all " + first + "s — try mixing it up";
            }
        }

        // Promotional > 25%
        long promoCount = mix.counts().getOrDefault("promotional", 0L);
        if (promoCount * 100 / total > 25) {
            return "Too many promotional posts this month";
        }

        // No testimonials
        if (mix.totalTyped() > 0 && mix.counts().getOrDefault("testimonial", 0L) == 0) {
            return "No testimonials this month — social proof builds trust";
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Prompt builders
    // -------------------------------------------------------------------------

    private String buildSystemPrompt(String calendarContext) {
        return """
            You are a content strategy expert for social media.
            Generate 5-7 content ideas as a JSON array. Each item must have these exact keys:
            {
              "title": "short descriptive title",
              "reason": "why this content works right now",
              "platform": "platform code (ig/tt/li/rd/x/fb/yt/st/it/gj)",
              "contentType": "video|image|carousel|text",
              "urgency": "high|medium|low",
              "estimatedEngagement": "above_average|average|below_average",
              "suggestedPrompt": "what to write in the generate box"
            }
            Return ONLY a valid JSON array. No markdown fences, no explanation.
            """ + calendarContext;
    }

    private String buildUserMessage(Project project) {
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        String dayName = dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        StringBuilder sb = new StringBuilder();
        sb.append("Today is ").append(dayName).append(", ").append(today).append("\n\n");
        sb.append("Project: ").append(project.getName()).append("\n");
        if (project.getWhatItIs() != null) sb.append("What it is: ").append(project.getWhatItIs()).append("\n");
        if (project.getWhoItsFor() != null) sb.append("Audience: ").append(project.getWhoItsFor()).append("\n");
        if (project.getCurrentStatus() != null) sb.append("Current status: ").append(project.getCurrentStatus()).append("\n");
        if (project.getIndustry() != null) sb.append("Industry: ").append(project.getIndustry()).append("\n");

        List<String> competitors = Stream.of(
            project.getCompetitor1(), project.getCompetitor2(), project.getCompetitor3()
        ).filter(c -> c != null && !c.isBlank()).toList();
        if (!competitors.isEmpty()) {
            sb.append("Competitors: ").append(String.join(", ", competitors)).append("\n");
        }

        sb.append("\nGenerate 5-7 timely content ideas for this project considering the day of week and current context.");
        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Parsing helpers
    // -------------------------------------------------------------------------

    private StrategySuggestionDto parseSuggestions(String json) {
        try {
            String cleaned = cleanJson(json);
            JsonNode arr = objectMapper.readTree(cleaned);
            List<StrategySuggestionDto.SuggestionItem> items = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    items.add(StrategySuggestionDto.SuggestionItem.builder()
                        .title(node.path("title").asText(""))
                        .reason(node.path("reason").asText(""))
                        .platform(node.path("platform").asText(""))
                        .contentType(node.path("contentType").asText(""))
                        .urgency(node.path("urgency").asText("medium"))
                        .estimatedEngagement(node.path("estimatedEngagement").asText("average"))
                        .suggestedPrompt(node.path("suggestedPrompt").asText(""))
                        .build());
                }
            }
            return StrategySuggestionDto.builder().suggestions(items).build();
        } catch (Exception e) {
            log.error("Failed to parse strategy suggestions: {}", e.getMessage());
            return StrategySuggestionDto.builder().suggestions(List.of()).build();
        }
    }

    private WeeklyPlanDto parseWeeklyPlan(String json) {
        try {
            String cleaned = cleanJson(json);
            JsonNode arr = objectMapper.readTree(cleaned);
            List<WeeklyPlanDto.DayPlan> days = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    days.add(WeeklyPlanDto.DayPlan.builder()
                        .dayIndex(node.path("dayIndex").asInt(0))
                        .dayLabel(node.path("dayLabel").asText(""))
                        .platform(node.path("platform").asText(""))
                        .contentType(node.path("contentType").asText(""))
                        .topic(node.path("topic").asText(""))
                        .suggestedPrompt(node.path("suggestedPrompt").asText(""))
                        .build());
                }
            }
            return WeeklyPlanDto.builder().days(days).build();
        } catch (Exception e) {
            log.error("Failed to parse weekly plan: {}", e.getMessage());
            return WeeklyPlanDto.builder().days(List.of()).build();
        }
    }

    private String cleanJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
        }
        return cleaned;
    }
}
