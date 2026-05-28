package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.HookInsightsDto;
import com.kontrol.model.PostPlatform;
import com.kontrol.repository.PostPlatformRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class HookPerformanceService {

    private final PostPlatformRepository postPlatformRepository;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;

    public HookInsightsDto getHookInsights(UUID projectId, String platform) {
        List<PostPlatform> posts = postPlatformRepository
            .findTop30PublishedByProjectAndPlatform(projectId.toString(), platform);

        // Filter posts that have hook text in extra_data
        List<PostPlatform> postsWithHooks = posts.stream()
            .filter(pp -> {
                if (pp.getExtraData() == null) return false;
                try {
                    JsonNode node = objectMapper.readTree(pp.getExtraData());
                    String hook = node.path("hook").asText(null);
                    return hook != null && !hook.isBlank();
                } catch (Exception e) {
                    return false;
                }
            })
            .toList();

        if (postsWithHooks.isEmpty()) {
            return HookInsightsDto.builder()
                .insights(List.of())
                .claudeAnalysis("No hook data available yet. Hooks are captured as posts are generated.")
                .build();
        }

        // Build hook -> score map
        Map<String, List<Double>> hookScores = new LinkedHashMap<>();
        for (PostPlatform pp : postsWithHooks) {
            try {
                JsonNode node = objectMapper.readTree(pp.getExtraData());
                String hook = node.path("hook").asText(null);
                if (hook != null && !hook.isBlank()) {
                    double score = pp.getPerformanceScore() != null
                        ? pp.getPerformanceScore().doubleValue() : 0.0;
                    hookScores.computeIfAbsent(hook, k -> new ArrayList<>()).add(score);
                }
            } catch (Exception ignored) {}
        }

        // Call Claude for pattern analysis
        String claudeAnalysis = analyzeHookPatterns(hookScores, platform);

        // Build basic insight items — one per unique hook (or grouped if many)
        List<HookInsightsDto.HookInsightItem> items = buildInsightItems(hookScores, claudeAnalysis);

        return HookInsightsDto.builder()
            .insights(items)
            .claudeAnalysis(claudeAnalysis)
            .build();
    }

    private String analyzeHookPatterns(Map<String, List<Double>> hookScores, String platform) {
        if (hookScores.isEmpty()) {
            return "No hook data to analyze yet.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Analyze these video hook texts and their performance scores for ").append(platform).append(".\n\n");
        hookScores.forEach((hook, scores) -> {
            double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            sb.append("Hook: \"").append(hook).append("\" — avg score: ").append(String.format("%.1f", avg)).append("\n");
        });
        sb.append("\nIdentify which hook styles (question hooks, shock hooks, curiosity hooks, etc.) perform best. ");
        sb.append("Give a 2-3 sentence analysis. Return ONLY the analysis text.");

        String systemPrompt = "You are a video marketing analyst specializing in hook performance.";
        try {
            return claudeService.callClaudeRaw(systemPrompt, sb.toString(), 512);
        } catch (Exception e) {
            log.warn("Hook analysis failed: {}", e.getMessage());
            return "Hook analysis requires CLAUDE_API_KEY configuration.";
        }
    }

    private List<HookInsightsDto.HookInsightItem> buildInsightItems(Map<String, List<Double>> hookScores, String claudeAnalysis) {
        // Group hooks by style keyword and compute averages
        Map<String, List<Double>> styleScores = new LinkedHashMap<>();

        for (Map.Entry<String, List<Double>> entry : hookScores.entrySet()) {
            String hook = entry.getKey().toLowerCase();
            String style = classifyHookStyle(hook);
            styleScores.computeIfAbsent(style, k -> new ArrayList<>()).addAll(entry.getValue());
        }

        List<HookInsightsDto.HookInsightItem> items = new ArrayList<>();
        styleScores.forEach((style, scores) -> {
            double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            String recommendation = avg > 50 ? "This style performs well for you"
                : avg > 20 ? "Average performance — try experimenting"
                : "This style underperforms — consider alternatives";
            items.add(HookInsightsDto.HookInsightItem.builder()
                .hookStyle(style)
                .avgScore(avg)
                .recommendation(recommendation)
                .build());
        });

        // Sort by avg score descending
        items.sort((a, b) -> Double.compare(b.getAvgScore(), a.getAvgScore()));
        return items;
    }

    private String classifyHookStyle(String hook) {
        if (hook.contains("?")) return "Question hook";
        if (hook.contains("!")) return "Exclamation hook";
        if (hook.startsWith("how") || hook.startsWith("why") || hook.startsWith("what")) return "How/Why hook";
        if (hook.contains("secret") || hook.contains("hidden") || hook.contains("reveal")) return "Curiosity hook";
        if (hook.contains("never") || hook.contains("stop") || hook.contains("don't")) return "Negative hook";
        if (hook.contains("best") || hook.contains("top") || hook.contains("ultimate")) return "Superlative hook";
        return "Statement hook";
    }
}
