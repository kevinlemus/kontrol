package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.StrategySuggestionDto;
import com.kontrol.model.Project;
import com.kontrol.model.StrategyCache;
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
import java.util.List;
import java.util.Locale;
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

    public StrategySuggestionDto getSuggestions(UUID projectId) {
        // Check 24h cache
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
        var cached = strategyCacheRepository.findRecentByProjectId(projectId, cutoff);
        if (cached.isPresent()) {
            return parseSuggestions(cached.get().getSuggestions());
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String systemPrompt = buildSystemPrompt();
        String userMessage = buildUserMessage(project);

        String responseText;
        try {
            responseText = claudeService.callClaudeRaw(systemPrompt, userMessage, 2048);
        } catch (Exception e) {
            log.error("Claude strategy generation failed: {}", e.getMessage(), e);
            return StrategySuggestionDto.builder().suggestions(List.of()).build();
        }

        // Cache the raw JSON response
        String cleaned = cleanJson(responseText);
        strategyCacheRepository.save(StrategyCache.builder()
            .projectId(projectId)
            .suggestions(cleaned)
            .build());

        return parseSuggestions(cleaned);
    }

    private String buildSystemPrompt() {
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
            """;
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

        // Add competitors if available
        List<String> competitors = Stream.of(
            project.getCompetitor1(), project.getCompetitor2(), project.getCompetitor3()
        ).filter(c -> c != null && !c.isBlank()).toList();
        if (!competitors.isEmpty()) {
            sb.append("Competitors: ").append(String.join(", ", competitors)).append("\n");
        }

        sb.append("\nGenerate 5-7 timely content ideas for this project considering the day of week and current context.");
        return sb.toString();
    }

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

    private String cleanJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
        }
        return cleaned;
    }
}
