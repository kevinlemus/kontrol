package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.DraftDto;
import com.kontrol.model.Post;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ClaudeService {

    private static final String ANTHROPIC_VERSION = "2023-06-01";

    // TODO: Add CLAUDE_API_KEY to backend/.env to activate generation
    @Value("${claude.api.key:}")
    private String apiKey;

    @Value("${claude.api.model:claude-sonnet-4-20250514}")
    private String model;

    @Value("${claude.api.base-url:https://api.anthropic.com}")
    private String baseUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ClaudeService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public Map<String, DraftDto> generatePosts(
            String projectName,
            String projectContext,
            List<Post> recentPosts,
            String userInput,
            List<String> platforms) {

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — returning placeholder drafts. Add to backend/.env to activate.");
            Map<String, DraftDto> placeholders = new HashMap<>();
            for (String pid : platforms) {
                placeholders.put(pid, DraftDto.builder()
                    .platformId(pid).content("[Add CLAUDE_API_KEY to .env to enable AI generation]")
                    .status("pending").build());
            }
            return placeholders;
        }

        String systemPrompt = buildSystemPrompt(projectName, projectContext, recentPosts);
        String userPrompt = "Generate posts for platforms: " + String.join(", ", platforms)
            + "\n\nKevin's prompt: " + userInput;
        String responseText = callClaude(systemPrompt, userPrompt, 4096);
        return parseDrafts(responseText, platforms);
    }

    public String generateRedditComment(String projectContext, String subreddit,
                                        String redditPostTitle, String redditPostBody) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — skipping Reddit comment generation");
            return "[Add CLAUDE_API_KEY to .env to enable AI comment suggestions]";
        }
        String system = "You are Kevin's assistant for the Kontrol social media app. Generate a genuine, helpful Reddit comment "
            + "that adds value and naturally mentions the project when relevant. Keep it 2-4 sentences. "
            + "Return ONLY the comment text, no JSON, no explanation.\n\nProject context:\n" + projectContext;
        String user = "Subreddit: r/" + subreddit + "\nPost title: " + redditPostTitle
            + "\nPost body: " + redditPostBody + "\n\nGenerate a comment:";
        return callClaude(system, user, 512);
    }

    private String buildSystemPrompt(String projectName, String projectContext, List<Post> recentPosts) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Kevin's personal social media content generator inside the Kontrol app.\n");
        sb.append("Kevin is a solo creator who uses one authentic voice across all platforms.\n\n");
        sb.append("PROJECT: ").append(projectName).append("\n");
        sb.append(projectContext).append("\n\n");
        if (recentPosts != null && !recentPosts.isEmpty()) {
            sb.append("RECENT POSTS (tone reference — last ").append(recentPosts.size()).append("):\n");
            for (Post p : recentPosts) {
                if (p.getInputContent() != null) {
                    String excerpt = p.getInputContent().length() > 200
                        ? p.getInputContent().substring(0, 200) : p.getInputContent();
                    sb.append("- ").append(excerpt).append("\n");
                }
            }
            sb.append("\n");
        }
        sb.append("""
PLATFORM RULES:
- IG: visual storytelling, 1-2 relevant hashtags, emoji ok
- TT: hook in first line, very short, viral energy
- LI: professional but personal, insight-driven
- RD: genuine value-add, conversational, no hard sell
- X: punchy, under 280 chars
- FB: conversational, community-focused
- YT: community post or description, SEO-friendly
- ST/IT/GJ: game update style, feature highlights, community hype

RESPONSE FORMAT — return ONLY valid JSON, no markdown fences, no explanation:
{
  "IG": { "content": "...", "title": null },
  "TT": { "content": "...", "title": null },
  "LI": { "content": "...", "title": null }
}
Only include the platforms requested. Do not include others.
""");
        return sb.toString();
    }

    private String callClaude(String systemPrompt, String userMessage, int maxTokens) {
        Map<String, Object> body = Map.of(
            "model", model,
            "max_tokens", maxTokens,
            "system", systemPrompt,
            "messages", List.of(Map.of("role", "user", "content", userMessage))
        );
        try {
            String response = webClient.post()
                .uri(baseUrl + "/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .header("content-type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return objectMapper.readTree(response).path("content").get(0).path("text").asText();
        } catch (Exception e) {
            log.error("Claude API call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Claude API call failed: " + e.getMessage(), e);
        }
    }

    private Map<String, DraftDto> parseDrafts(String responseText, List<String> platforms) {
        Map<String, DraftDto> result = new HashMap<>();
        try {
            String cleaned = responseText.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            JsonNode root = objectMapper.readTree(cleaned);
            for (String pid : platforms) {
                JsonNode node = root.path(pid);
                if (!node.isMissingNode()) {
                    result.put(pid, DraftDto.builder()
                        .platformId(pid)
                        .content(node.path("content").asText(""))
                        .title(node.path("title").isNull() ? null : node.path("title").asText())
                        .status("pending")
                        .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Claude response. Raw: {}", responseText, e);
            for (String pid : platforms) {
                result.put(pid, DraftDto.builder().platformId(pid)
                    .content("Generation failed — please retry").status("pending").build());
            }
        }
        return result;
    }
}
