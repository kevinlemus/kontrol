package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.DraftDto;
import com.kontrol.dto.PerformanceInsightDto;
import com.kontrol.dto.UserContextDto;
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

    /** Zero-extras overload — no subreddits, no insights. */
    public Map<String, DraftDto> generatePosts(
            String projectName,
            UserContextDto userContext,
            String projectContext,
            List<Post> recentPosts,
            String userInput,
            List<String> platforms) {
        return generatePosts(projectName, userContext, projectContext, recentPosts, userInput, platforms,
            List.of(), List.of(), List.of(), Map.of());
    }

    /**
     * Generate posts for given platforms. When "RD" is included, Claude selects the single best
     * subreddit from the provided list (filtered to exclude cooling-down subreddits).
     *
     * @param eligibleSubreddits List of subreddit names eligible for posting (cooldown already filtered out)
     * @param allSubreddits      Full list for display context (includes cooling-down ones)
     * @param insights           Per-platform performance insights to inject into the system prompt
     * @param subredditScores    Avg performance scores per subreddit to weight Claude's selection
     */
    public Map<String, DraftDto> generatePosts(
            String projectName,
            UserContextDto userContext,
            String projectContext,
            List<Post> recentPosts,
            String userInput,
            List<String> platforms,
            List<String> eligibleSubreddits,
            List<String> allSubreddits,
            List<PerformanceInsightDto> insights,
            Map<String, Double> subredditScores) {

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — returning placeholder drafts. Add to backend/.env to activate.");
            Map<String, DraftDto> placeholders = new HashMap<>();
            for (String pid : platforms) {
                DraftDto dto = DraftDto.builder()
                    .platformId(pid).content("[Add CLAUDE_API_KEY to .env to enable AI generation]")
                    .status("pending").build();
                if ("RD".equals(pid) && !eligibleSubreddits.isEmpty()) {
                    dto.setSelectedSubreddit(eligibleSubreddits.get(0));
                    dto.setSubredditReasoning("Subreddit selection requires CLAUDE_API_KEY");
                }
                placeholders.put(pid, dto);
            }
            return placeholders;
        }

        String name = (userContext != null && userContext.getName() != null) ? userContext.getName() : "the user";
        String systemPrompt = buildSystemPrompt(projectName, userContext, projectContext, recentPosts,
            eligibleSubreddits, allSubreddits, insights, subredditScores);
        String userPrompt = "Generate posts for platforms: " + String.join(", ", platforms)
            + "\n\n" + name + "'s prompt: " + userInput;
        String responseText = callClaude(systemPrompt, userPrompt, 4096);
        return parseDrafts(responseText, platforms);
    }

    public String generateRedditComment(UserContextDto userContext, String projectContext, String subreddit,
                                        String redditPostTitle, String redditPostBody) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — skipping Reddit comment generation");
            return "[Add CLAUDE_API_KEY to .env to enable AI comment suggestions]";
        }
        String name = (userContext != null && userContext.getName() != null) ? userContext.getName() : "the user";
        String vp = userContext != null ? userContext.getVoiceProfile() : null;
        StringBuilder systemSb = new StringBuilder();
        systemSb.append("You are ").append(name).append("'s assistant for the Kontrol social media app. ");
        systemSb.append("Generate a genuine, helpful Reddit comment that adds value and naturally mentions the project when relevant. ");
        systemSb.append("Keep it 2-4 sentences. Return ONLY the comment text, no JSON, no explanation.\n\n");
        if (vp != null && !vp.isBlank()) {
            systemSb.append("VOICE & TONE PROFILE (match this exactly):\n").append(vp).append("\n\n");
        }
        systemSb.append("Project context:\n").append(projectContext);
        String user = "Subreddit: r/" + subreddit + "\nPost title: " + redditPostTitle
            + "\nPost body: " + redditPostBody + "\n\nGenerate a comment:";
        return callClaude(systemSb.toString(), user, 512);
    }

    private String buildSystemPrompt(String projectName, UserContextDto userContext, String projectContext,
                                      List<Post> recentPosts,
                                      List<String> eligibleSubreddits,
                                      List<String> allSubreddits,
                                      List<PerformanceInsightDto> insights,
                                      Map<String, Double> subredditScores) {
        String name = (userContext != null && userContext.getName() != null) ? userContext.getName() : "the user";
        StringBuilder sb = new StringBuilder();
        sb.append("You are ").append(name).append("'s personal social media content generator inside the Kontrol app.\n");
        sb.append(name).append(" is a solo creator who uses one authentic voice across all platforms.\n\n");

        // Voice profile injection
        String vp = userContext != null ? userContext.getVoiceProfile() : null;
        if (vp != null && !vp.isBlank()) {
            sb.append("VOICE & TONE PROFILE (match this exactly — do not sanitize or over-polish):\n");
            sb.append(vp).append("\n\n");
        }

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

        // Performance insights injection
        if (insights != null && !insights.isEmpty()) {
            List<PerformanceInsightDto> useful = insights.stream()
                .filter(PerformanceInsightDto::isHasEnoughData).toList();
            if (!useful.isEmpty()) {
                sb.append("\nPERFORMANCE INSIGHTS FOR THIS PROJECT (calibrate suggestions accordingly):\n");
                for (PerformanceInsightDto insight : useful) {
                    sb.append("- ").append(insight.getPlatform()).append(": ")
                      .append(insight.getInsightSummary()).append("\n");
                }
            }
        }

        // Subreddit performance scores
        if (subredditScores != null && !subredditScores.isEmpty()) {
            sb.append("\nSUBREDDIT PERFORMANCE SCORES (weight higher-scoring subreddits more heavily):\n");
            subredditScores.forEach((sub, score) ->
                sb.append(String.format("  - r/%s: avg score %.1f%n", sub, score)));
        }

        if (!allSubreddits.isEmpty()) {
            sb.append("\nREDDIT SUBREDDIT SELECTION:\n");
            sb.append("You must select EXACTLY ONE subreddit for the RD post from the eligible list below.\n");
            sb.append("Never post to multiple subreddits for the same content.\n\n");

            if (!eligibleSubreddits.isEmpty()) {
                sb.append("ELIGIBLE subreddits (pick one):\n");
                for (String sub : eligibleSubreddits) {
                    sb.append("  - r/").append(sub).append("\n");
                }
            } else {
                sb.append("WARNING: All subreddits are currently in cooldown (posted within 48h).\n");
                sb.append("Pick the least recently posted one from: ").append(String.join(", ", allSubreddits)).append("\n");
            }

            sb.append("\nFor the 'RD' platform in your JSON response, include these additional fields:\n");
            sb.append("  \"selectedSubreddit\": \"subredditname\" (without r/ prefix),\n");
            sb.append("  \"subredditReasoning\": \"One sentence explaining why this subreddit is the best fit\"\n");
        }
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
                    DraftDto draft = DraftDto.builder()
                        .platformId(pid)
                        .content(node.path("content").asText(""))
                        .title(node.path("title").isNull() ? null : node.path("title").asText())
                        .status("pending")
                        .build();
                    if ("RD".equals(pid)) {
                        String selectedSub = node.path("selectedSubreddit").isNull()
                            ? null : node.path("selectedSubreddit").asText(null);
                        String reasoning = node.path("subredditReasoning").isNull()
                            ? null : node.path("subredditReasoning").asText(null);
                        draft.setSelectedSubreddit(selectedSub);
                        draft.setSubredditReasoning(reasoning);
                    }
                    result.put(pid, draft);
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
