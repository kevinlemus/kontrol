package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.CompetitorInsightDto;
import com.kontrol.model.CompetitorInsight;
import com.kontrol.model.Project;
import com.kontrol.repository.CompetitorInsightRepository;
import com.kontrol.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompetitorService {

    private final CompetitorInsightRepository competitorInsightRepository;
    private final ProjectRepository projectRepository;
    private final ClaudeService claudeService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public CompetitorInsightDto analyze(UUID projectId, String competitorName, String platform) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // Optionally fetch Reddit data
        String fetchedData = "";
        if ("reddit".equalsIgnoreCase(platform)) {
            fetchedData = fetchRedditData(competitorName);
        }

        // Build Claude prompt
        String systemPrompt = buildAnalysisSystemPrompt();
        String userMessage = buildAnalysisUserMessage(project, competitorName, platform, fetchedData);

        String responseText;
        try {
            responseText = claudeService.callClaudeRaw(systemPrompt, userMessage, 1024);
        } catch (Exception e) {
            log.error("Claude competitor analysis failed: {}", e.getMessage(), e);
            responseText = buildFallbackJson(competitorName, platform);
        }

        // Parse Claude's JSON response
        CompetitorInsightDto dto = parseAnalysisResponse(responseText, competitorName, platform);

        // Upsert into DB
        CompetitorInsight insight = competitorInsightRepository
            .findByProjectIdAndCompetitorNameAndPlatform(projectId, competitorName, platform)
            .orElse(CompetitorInsight.builder().projectId(projectId).build());

        insight.setCompetitorName(competitorName);
        insight.setPlatform(platform);
        insight.setPostFrequency(dto.getPostFrequency());
        insight.setTopContentTypes(dto.getTopContentTypes());
        insight.setEngagementPatterns(dto.getEngagementPatterns());
        insight.setClaudeAnalysis(dto.getClaudeAnalysis());
        insight.setDifferentiationTips(dto.getDifferentiationTips());
        insight.setLastAnalyzedAt(OffsetDateTime.now());

        competitorInsightRepository.save(insight);
        dto.setLastAnalyzedAt(insight.getLastAnalyzedAt());
        return dto;
    }

    public CompetitorInsightDto getInsights(UUID projectId, String competitorName, String platform) {
        return competitorInsightRepository
            .findByProjectIdAndCompetitorNameAndPlatform(projectId, competitorName, platform)
            .map(i -> CompetitorInsightDto.builder()
                .competitorName(i.getCompetitorName())
                .platform(i.getPlatform())
                .postFrequency(i.getPostFrequency())
                .topContentTypes(i.getTopContentTypes())
                .engagementPatterns(i.getEngagementPatterns())
                .claudeAnalysis(i.getClaudeAnalysis())
                .differentiationTips(i.getDifferentiationTips())
                .lastAnalyzedAt(i.getLastAnalyzedAt())
                .build())
            .orElse(null);
    }

    public List<String> suggestCompetitors(UUID projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String industry = project.getIndustry();
        if (industry == null || industry.isBlank()) {
            return List.of();
        }

        String systemPrompt = "You are a market research expert. Return ONLY a JSON array of exactly 3 brand/account name strings. No explanation, no markdown.";
        String userMessage = "What are the top 3 known brands/accounts in the " + industry
            + " space on social media? Return as JSON array: [\"BrandA\", \"BrandB\", \"BrandC\"]";

        try {
            String response = claudeService.callClaudeRaw(systemPrompt, userMessage, 256);
            String cleaned = response.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            JsonNode arr = objectMapper.readTree(cleaned);
            List<String> suggestions = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    suggestions.add(node.asText());
                }
            }
            return suggestions;
        } catch (Exception e) {
            log.error("Failed to get competitor suggestions: {}", e.getMessage(), e);
            return List.of();
        }
    }

    private String fetchRedditData(String username) {
        try {
            String resp = webClientBuilder.build().get()
                .uri("https://www.reddit.com/user/" + username + "/submitted.json?limit=10")
                .header("User-Agent", "Kontrol/1.0")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            JsonNode root = objectMapper.readTree(resp);
            JsonNode children = root.path("data").path("children");
            if (!children.isArray() || children.isEmpty()) return "";
            StringBuilder sb = new StringBuilder("Reddit posts by u/" + username + ":\n");
            for (JsonNode child : children) {
                JsonNode post = child.path("data");
                sb.append("- ").append(post.path("title").asText("")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Reddit data fetch failed for {}: {}", username, e.getMessage());
            return "";
        }
    }

    private String buildAnalysisSystemPrompt() {
        return """
            You are a social media competitive intelligence analyst.
            Analyze the competitor and return ONLY valid JSON with these exact keys:
            {
              "postFrequency": "e.g. 3-4x per week",
              "topContentTypes": "e.g. Short-form video, behind-the-scenes",
              "engagementPatterns": "e.g. High engagement on Tuesday evenings",
              "claudeAnalysis": "2-3 sentences of strategic analysis",
              "differentiationTips": "2-3 sentences on how to differentiate"
            }
            No markdown fences. Return only the JSON object.
            """;
    }

    private String buildAnalysisUserMessage(Project project, String competitorName, String platform, String fetchedData) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyze competitor: ").append(competitorName).append("\n");
        sb.append("Platform: ").append(platform).append("\n");
        sb.append("My project: ").append(project.getName()).append(" — ").append(project.getWhatItIs()).append("\n");
        sb.append("My audience: ").append(project.getWhoItsFor()).append("\n");
        if (project.getIndustry() != null) {
            sb.append("Industry: ").append(project.getIndustry()).append("\n");
        }
        if (!fetchedData.isBlank()) {
            sb.append("\nFetched data:\n").append(fetchedData);
        }
        return sb.toString();
    }

    private CompetitorInsightDto parseAnalysisResponse(String responseText, String competitorName, String platform) {
        try {
            String cleaned = responseText.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            JsonNode root = objectMapper.readTree(cleaned);
            return CompetitorInsightDto.builder()
                .competitorName(competitorName)
                .platform(platform)
                .postFrequency(root.path("postFrequency").asText("Unknown"))
                .topContentTypes(root.path("topContentTypes").asText("Unknown"))
                .engagementPatterns(root.path("engagementPatterns").asText("Unknown"))
                .claudeAnalysis(root.path("claudeAnalysis").asText(""))
                .differentiationTips(root.path("differentiationTips").asText(""))
                .build();
        } catch (Exception e) {
            log.error("Failed to parse competitor analysis response: {}", e.getMessage());
            return CompetitorInsightDto.builder()
                .competitorName(competitorName)
                .platform(platform)
                .postFrequency("Unknown")
                .topContentTypes("Unknown")
                .engagementPatterns("Unknown")
                .claudeAnalysis(responseText)
                .differentiationTips("")
                .build();
        }
    }

    private String buildFallbackJson(String competitorName, String platform) {
        return "{\"postFrequency\":\"Unknown\",\"topContentTypes\":\"Unknown\",\"engagementPatterns\":\"Unknown\","
            + "\"claudeAnalysis\":\"Analysis unavailable — check CLAUDE_API_KEY configuration.\","
            + "\"differentiationTips\":\"Configure Claude API to enable differentiation tips.\"}";
    }
}
