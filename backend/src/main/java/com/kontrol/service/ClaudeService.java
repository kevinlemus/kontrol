package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.DraftDto;
import com.kontrol.dto.PerformanceInsightDto;
import com.kontrol.dto.ProjectContextDto;
import com.kontrol.dto.UserContextDto;
import com.kontrol.model.Post;
import com.kontrol.model.PostPlatform;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class ClaudeService {

    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private static final Map<String, String> PLATFORM_DISPLAY_NAMES = Map.ofEntries(
        Map.entry("IG", "Instagram"), Map.entry("TT", "TikTok"),
        Map.entry("LI", "LinkedIn"), Map.entry("RD", "Reddit"),
        Map.entry("X", "X (Twitter)"), Map.entry("FB", "Facebook"),
        Map.entry("YT", "YouTube"), Map.entry("ST", "Steam"),
        Map.entry("IT", "itch.io"), Map.entry("GJ", "Game Jolt")
    );

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

    /** Zero-extras overload — no subreddits, no insights, no edit history. */
    public Map<String, DraftDto> generatePosts(
            String projectName,
            UserContextDto userContext,
            String projectContext,
            List<Post> recentPosts,
            String userInput,
            List<String> platforms) {
        return generatePosts(projectName, userContext, projectContext, recentPosts, userInput, platforms,
            List.of(), List.of(), List.of(), Map.of(), Map.of());
    }

    /**
     * Full overload accepting {@link ProjectContextDto} — carries competitive intelligence
     * (industry + competitors) in addition to the standard project fields.
     */
    public Map<String, DraftDto> generatePosts(
            ProjectContextDto projectContext,
            UserContextDto userContext,
            List<Post> recentPosts,
            String userInput,
            List<String> platforms,
            List<String> eligibleSubreddits,
            List<String> allSubreddits,
            List<PerformanceInsightDto> insights,
            Map<String, Double> subredditScores,
            Map<String, List<PostPlatform>> editHistoryByPlatform) {

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — returning placeholder drafts. Add to backend/.env to activate.");
            Map<String, DraftDto> placeholders = new HashMap<>();
            for (String pid : platforms) {
                DraftDto dto = DraftDto.builder()
                    .platformId(pid).content("[Add CLAUDE_API_KEY to .env to enable AI generation]")
                    .status("pending").build();
                dto.setHook("Add CLAUDE_API_KEY to see hooks");
                if ("RD".equals(pid) && !eligibleSubreddits.isEmpty()) {
                    dto.setSelectedSubreddit(eligibleSubreddits.get(0));
                    dto.setSubredditReasoning("Subreddit selection requires CLAUDE_API_KEY");
                }
                placeholders.put(pid, dto);
            }
            return placeholders;
        }

        String name = (userContext != null && userContext.getName() != null) ? userContext.getName() : "the user";
        String systemPrompt = buildSystemPrompt(projectContext, userContext, recentPosts,
            eligibleSubreddits, allSubreddits, insights, subredditScores, platforms, editHistoryByPlatform);
        String userPrompt = "Generate posts for platforms: " + String.join(", ", platforms)
            + "\n\n" + name + "'s prompt: " + userInput;
        String responseText = callClaude(systemPrompt, userPrompt, 4096);
        return parseDrafts(responseText, platforms);
    }

    /**
     * Generate posts for given platforms. When "RD" is included, Claude selects the single best
     * subreddit from the provided list (filtered to exclude cooling-down subreddits).
     *
     * @param eligibleSubreddits List of subreddit names eligible for posting (cooldown already filtered out)
     * @param allSubreddits      Full list for display context (includes cooling-down ones)
     * @param insights           Per-platform performance insights to inject into the system prompt
     * @param subredditScores    Avg performance scores per subreddit to weight Claude's selection
     * @param editHistoryByPlatform Map of platform ID to its Tier 2 edit history (may be empty)
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
            Map<String, Double> subredditScores,
            Map<String, List<PostPlatform>> editHistoryByPlatform) {

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — returning placeholder drafts. Add to backend/.env to activate.");
            Map<String, DraftDto> placeholders = new HashMap<>();
            for (String pid : platforms) {
                DraftDto dto = DraftDto.builder()
                    .platformId(pid).content("[Add CLAUDE_API_KEY to .env to enable AI generation]")
                    .status("pending").build();
                dto.setHook("Add CLAUDE_API_KEY to see hooks");
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
            eligibleSubreddits, allSubreddits, insights, subredditScores, platforms, editHistoryByPlatform);
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
        StringBuilder systemSb = new StringBuilder();
        systemSb.append("You are ").append(name).append("'s assistant for the Kontrol social media app.\n\n");
        systemSb.append("PLATFORM CONTEXT: You are generating content for Reddit. ")
                .append("Apply your knowledge of what content strategies, formats, tone, and ")
                .append("posting patterns perform best on Reddit for this type of content and audience. ")
                .append("Consider platform culture, algorithm preferences, and audience expectations.\n\n");
        systemSb.append("Generate a genuine, helpful Reddit comment that adds value and naturally mentions the project when relevant. ");
        systemSb.append("Keep it 2-4 sentences. Return ONLY the comment text, no JSON, no explanation.\n\n");
        systemSb.append("Project context:\n").append(projectContext);
        String user = "Subreddit: r/" + subreddit + "\nPost title: " + redditPostTitle
            + "\nPost body: " + redditPostBody + "\n\nGenerate a comment:";
        return callClaude(systemSb.toString(), user, 512);
    }

    /** buildSystemPrompt variant for the ProjectContextDto-based overload — includes Tier 4. */
    private String buildSystemPrompt(ProjectContextDto project,
                                      UserContextDto userContext,
                                      List<Post> recentPosts,
                                      List<String> eligibleSubreddits,
                                      List<String> allSubreddits,
                                      List<PerformanceInsightDto> insights,
                                      Map<String, Double> subredditScores,
                                      List<String> platforms,
                                      Map<String, List<PostPlatform>> editHistoryByPlatform) {
        String flatContext = String.format(
            "Name: %s\nWhat it is: %s\nWho it's for: %s\nVibe: %s\nCurrent status: %s",
            nvl(project.getName()), nvl(project.getWhatItIs()),
            nvl(project.getWhoItsFor()), nvl(project.getVibe()),
            nvl(project.getCurrentStatus()));

        // Build the base prompt using the existing string-based builder
        String base = buildSystemPrompt(project.getName(), userContext, flatContext, recentPosts,
            eligibleSubreddits, allSubreddits, insights, subredditScores, platforms, editHistoryByPlatform);

        // Tier 4 — Competitive & industry context
        String industry = project.getIndustry();
        String comp1 = project.getCompetitor1();
        String comp2 = project.getCompetitor2();
        String comp3 = project.getCompetitor3();

        boolean hasIndustry = industry != null && !industry.isBlank();
        List<String> competitors = new ArrayList<>();
        if (comp1 != null && !comp1.isBlank()) competitors.add(comp1);
        if (comp2 != null && !comp2.isBlank()) competitors.add(comp2);
        if (comp3 != null && !comp3.isBlank()) competitors.add(comp3);
        boolean hasCompetitors = !competitors.isEmpty();

        String projectContextText = project.getProjectContextText();
        boolean hasDocContext = projectContextText != null && !projectContextText.isBlank();

        boolean hasPlatformNotes = project.getPlatformCompetitorNotes() != null
            && !project.getPlatformCompetitorNotes().isEmpty();

        // Inject platform voice profiles from historical post analysis (Tier 2 enhancement)
        Map<String, String> voiceProfiles = project.getPlatformVoiceProfiles();
        boolean hasVoiceProfiles = voiceProfiles != null && !voiceProfiles.isEmpty();

        if (!hasIndustry && !hasCompetitors && !hasDocContext && !hasPlatformNotes && !hasVoiceProfiles) {
            return base;
        }

        StringBuilder sb = new StringBuilder(base);

        if (hasVoiceProfiles) {
            sb.append("PLATFORM VOICE PROFILES (from historical post analysis):\n\n");
            for (String platform : platforms) {
                String profile = voiceProfiles.get(platform);
                if (profile != null && !profile.isBlank()) {
                    String pName = PLATFORM_DISPLAY_NAMES.getOrDefault(platform, platform);
                    sb.append("For ").append(pName).append(": ").append(profile).append("\n\n");
                }
            }
        }

        // Tier 4 — Generic competitive & industry context
        if (hasIndustry) {
            sb.append("INDUSTRY CONTEXT: This project is in the ")
              .append(industry)
              .append(" industry. Apply your knowledge of what content strategies ")
              .append("and posting patterns perform best in this industry. Consider ")
              .append("the typical audience, purchase drivers, trust signals, and ")
              .append("content formats that work for this space.\n\n");
        }
        if (hasCompetitors) {
            sb.append("COMPETITIVE CONTEXT: This project competes with: ")
              .append(String.join(", ", competitors))
              .append(". When generating posts: differentiate from these competitors, ")
              .append("highlight what makes this product or service unique, position ")
              .append("this brand as the better alternative without directly attacking ")
              .append("competitors.\n\n");
        }

        // Tier 4 (platform-aware) — per-platform competitive intelligence
        if (hasIndustry || hasCompetitors || hasPlatformNotes) {
            sb.append("PLATFORM-SPECIFIC COMPETITIVE INTELLIGENCE:\n\n");
            Map<String, String> platformNotes = hasPlatformNotes
                ? project.getPlatformCompetitorNotes() : Map.of();
            for (String platform : platforms) {
                String platformName = PLATFORM_DISPLAY_NAMES.getOrDefault(platform, platform);
                sb.append("Platform: ").append(platformName).append("\n");
                sb.append("When generating content for ").append(platformName).append(", consider:\n");
                if (hasIndustry) {
                    sb.append("- What content formats perform best in the ")
                      .append(industry).append(" space on ").append(platformName).append("\n");
                }
                if (hasCompetitors) {
                    sb.append("- How ").append(String.join(", ", competitors))
                      .append(" typically position themselves on ").append(platformName).append("\n");
                    sb.append("- What differentiates this brand from those competitors specifically on ")
                      .append(platformName).append("\n");
                }
                if (hasIndustry) {
                    sb.append("- Tone and format conventions that work for ")
                      .append(industry).append(" on ").append(platformName).append("\n");
                }
                sb.append("Apply your knowledge of current ").append(platformName)
                  .append(" trends and best practices");
                if (hasIndustry) {
                    sb.append(" for ").append(industry);
                }
                sb.append(".\n");
                sb.append("Do not copy competitors — differentiate from them.\n");
                String extraNote = platformNotes.get(platform);
                if (extraNote != null && !extraNote.isBlank()) {
                    sb.append("Additional competitive context for ").append(platformName).append(":\n")
                      .append(extraNote).append("\n");
                }
                sb.append("\n");
            }
        }

        // Tier 5 — Project documentation
        if (hasDocContext) {
            String ctx = projectContextText.length() > 4000
                ? projectContextText.substring(0, 4000) + "..."
                : projectContextText;
            sb.append("PROJECT DOCUMENTATION:\n")
              .append("The following is context provided by the user about this project. ")
              .append("Use it to inform tone, messaging, and content decisions:\n\n")
              .append(ctx)
              .append("\n\n");
        }

        return sb.toString();
    }

    /**
     * Build per-platform competitive notes from existing project data.
     * No extra Claude API call — uses project industry + competitors to construct
     * a structured framing string for each platform.
     */
    Map<String, String> buildPlatformCompetitorNotes(ProjectContextDto ctx, List<String> platforms) {
        Map<String, String> notes = new HashMap<>();
        if (ctx.getIndustry() == null && ctx.getCompetitor1() == null) return notes;

        String competitors = Stream.of(ctx.getCompetitor1(), ctx.getCompetitor2(), ctx.getCompetitor3())
            .filter(c -> c != null && !c.isBlank())
            .collect(Collectors.joining(", "));

        for (String platform : platforms) {
            String note = buildNoteForPlatform(platform, ctx.getIndustry(), competitors);
            if (note != null) notes.put(platform, note);
        }
        return notes;
    }

    private String buildNoteForPlatform(String platform, String industry, String competitors) {
        String ind = industry != null ? industry : "this industry";
        String comp = competitors != null && !competitors.isBlank() ? competitors : "established players";
        return switch (platform.toUpperCase()) {
            case "IG" -> "Instagram: favor visual storytelling, Reels over static, trending audio. Industry: "
                + ind + ". Competitors: " + comp
                + ". Stand out via authentic behind-the-scenes and strong visual brand identity.";
            case "TT" -> "TikTok: hook in first 2 seconds, trending sounds, challenge formats. Industry: "
                + ind + ". Competitors: " + comp
                + ". Win via raw authenticity and humor over polished production.";
            case "LI" -> "LinkedIn: thought leadership, professional insights, personal journey. Industry: "
                + ind + ". Competitors: " + comp
                + ". Lead with data and lessons learned.";
            case "RD" -> "Reddit: community value first, no overt promotion, answer questions genuinely. Industry: "
                + ind + ". Competitors: " + comp
                + ". Be helpful — let the product speak for itself.";
            case "X" -> "X (Twitter): brevity, wit, hot takes, threads for depth. Industry: "
                + ind + ". Competitors: " + comp
                + ". Win with distinctive voice and timely commentary.";
            case "FB" -> "Facebook: community building, longer storytelling, events and groups. Industry: "
                + ind + ". Competitors: " + comp
                + ". Prioritize engagement and shares over reach.";
            case "YT" -> "YouTube: searchable titles, strong thumbnails, value-first content. Industry: "
                + ind + ". Competitors: " + comp
                + ". Win via tutorials and deep-dives that rank.";
            case "ST" -> "Steam: authentic dev logs, community Q&A, showcase gameplay. Industry: "
                + ind + ". Competitors: " + comp
                + ". Build community trust through transparency.";
            case "IT" -> "itch.io: indie dev story, dev logs, jam entries. Industry: "
                + ind + ". Competitors: " + comp
                + ". Stand out via distinctive art style and dev personality.";
            case "GJ" -> "Game Jolt: fan engagement, update logs, screenshots/GIFs. Industry: "
                + ind + ". Competitors: " + comp
                + ". Win via frequent updates and community interaction.";
            default -> null;
        };
    }

    private String nvl(String s) { return s != null ? s : "N/A"; }

    private String buildSystemPrompt(String projectName, UserContextDto userContext, String projectContext,
                                      List<Post> recentPosts,
                                      List<String> eligibleSubreddits,
                                      List<String> allSubreddits,
                                      List<PerformanceInsightDto> insights,
                                      Map<String, Double> subredditScores,
                                      List<String> platforms,
                                      Map<String, List<PostPlatform>> editHistoryByPlatform) {
        String name = (userContext != null && userContext.getName() != null) ? userContext.getName() : "the user";
        StringBuilder sb = new StringBuilder();

        // Header — always present
        sb.append("You are ").append(name).append("'s social media content generator for Kontrol.\n\n");

        // Tier 1 — Dynamic platform context (one block per requested platform)
        for (String platform : platforms) {
            String platformName = PLATFORM_DISPLAY_NAMES.getOrDefault(platform, platform);
            sb.append("PLATFORM CONTEXT: You are generating content for ")
              .append(platformName)
              .append(". Apply your knowledge of what content strategies, formats, tone, and ")
              .append("posting patterns perform best on ")
              .append(platformName)
              .append(" for this type of content and audience. Consider platform culture, ")
              .append("algorithm preferences, and audience expectations.\n\n");
        }

        // Tier 2 — Learned patterns per platform (only when edit history exists)
        if (editHistoryByPlatform != null) {
            for (String platform : platforms) {
                List<PostPlatform> editHistory = editHistoryByPlatform.get(platform);
                if (editHistory != null && !editHistory.isEmpty()) {
                    sb.append("LEARNED PATTERNS FOR THIS ACCOUNT ON ").append(platform).append(":\n");
                    sb.append("Based on past edits, this account writes like this:\n");
                    for (PostPlatform edit : editHistory) {
                        String original = edit.getOriginalContent();
                        String edited = edit.getContent();
                        if (original != null && edited != null && !original.equals(edited)) {
                            if (original.length() > 200) original = original.substring(0, 200) + "...";
                            if (edited.length() > 200) edited = edited.substring(0, 200) + "...";
                            sb.append("- \"").append(edited).append("\" (changed from: \"").append(original).append("\")\n");
                        }
                    }
                    sb.append("Match this style closely.\n\n");
                }
            }
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
HOOK FIELD: For each platform, also generate a 'hook' field: a 5-8 word punchy text optimized for on-screen video overlay. Make it attention-grabbing, platform-appropriate, and designed to stop the scroll. It should work as an overlay caption on a video — short, punchy, no hashtags.

RESPONSE FORMAT — return ONLY valid JSON, no markdown fences, no explanation:
{
  "IG": { "content": "...", "title": null, "hook": "5-8 word punchy hook text" },
  "TT": { "content": "...", "title": null, "hook": "..." },
  "LI": { "content": "...", "title": null, "hook": "..." }
}
Only include the platforms requested. Do not include others.
""");

        // Tier 3 — Performance insights (unchanged)
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

    /**
     * Analyze scraped website text and return structured brand info.
     * Returns map with keys: name, what_it_is, who_its_for, vibe, suggested_tagline,
     * industry (String), competitors (List&lt;String&gt;, up to 3, may be empty).
     */
    public Map<String, Object> analyzeWebsite(String textContent, boolean isSocialProfile) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY not set — cannot analyze website");
            throw new RuntimeException("CLAUDE_API_KEY not configured");
        }
        String extractionPrompt = isSocialProfile
            ? "This is content from a social media profile. Extract: 1) The person/brand name 2) What they do in one sentence 3) Who their audience is in one sentence 4) Their tone/vibe in one sentence. Return ONLY valid JSON: {\"name\":\"\",\"what_it_is\":\"\",\"who_its_for\":\"\",\"vibe\":\"\",\"suggested_tagline\":\"\",\"industry\":\"\",\"competitors\":[]}"
            : """
              Analyze this website content and extract:
              1) The product/business name
              2) What it is in one sentence
              3) Who it's for in one sentence
              4) The brand tone/vibe in one sentence
              5) What industry is this business in? One short phrase, be specific (e.g. "indie game development", "AI music tools", "B2B SaaS")
              6) Are any competitors mentioned or clearly implied? List up to 3 by name only.

              Return ONLY valid JSON with these exact keys:
              {"name":"","what_it_is":"","who_its_for":"","vibe":"","suggested_tagline":"","industry":"","competitors":["","",""]}

              competitors should be an empty array [] if none found. Do not invent competitors that are not mentioned or strongly implied.""";

        String systemPrompt = "You are a brand analyst. Extract structured info from website content. Return ONLY valid JSON with no markdown fences.";
        String userMessage = textContent + "\n\n" + extractionPrompt;

        String responseText = callClaude(systemPrompt, userMessage, 768);

        try {
            String cleaned = responseText.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            JsonNode root = objectMapper.readTree(cleaned);
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("name", root.path("name").asText(""));
            result.put("what_it_is", root.path("what_it_is").asText(""));
            result.put("who_its_for", root.path("who_its_for").asText(""));
            result.put("vibe", root.path("vibe").asText(""));
            result.put("suggested_tagline", root.path("suggested_tagline").asText(""));
            result.put("industry", root.path("industry").asText(""));

            List<String> competitors = new ArrayList<>();
            JsonNode competitorsNode = root.path("competitors");
            if (competitorsNode.isArray()) {
                for (JsonNode c : competitorsNode) {
                    String val = c.asText("").trim();
                    if (!val.isBlank()) competitors.add(val);
                }
            }
            result.put("competitors", competitors);

            return result;
        } catch (Exception e) {
            log.error("Failed to parse analyzeWebsite Claude response. Raw: {}", responseText, e);
            throw new RuntimeException("Failed to parse Claude response: " + e.getMessage(), e);
        }
    }

    /**
     * Analyze a list of posts to extract voice patterns and writing style.
     * Returns a concise summary to be stored as the platform voice profile.
     */
    public String analyzeVoicePatterns(List<String> posts, String platform) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Voice profile requires CLAUDE_API_KEY";
        }
        if (posts == null || posts.isEmpty()) return null;

        String platformName = PLATFORM_DISPLAY_NAMES.getOrDefault(platform, platform);
        StringBuilder sb = new StringBuilder();
        sb.append("Analyze these ").append(posts.size())
          .append(" posts from a creator's ").append(platformName).append(" account:\n\n");
        for (int i = 0; i < Math.min(posts.size(), 20); i++) {
            sb.append(i + 1).append(". ").append(posts.get(i), 0, Math.min(posts.get(i).length(), 300)).append("\n\n");
        }
        sb.append("Extract this creator's writing voice for ").append(platformName)
          .append(". Summarize in 3-4 sentences: their tone, sentence structure, vocabulary choices, ")
          .append("humor level, use of slang/emojis, how personal vs. professional they are. ")
          .append("This summary will be injected into future Claude prompts to match their voice. ")
          .append("Be specific and actionable. Return ONLY the summary, no headers, no JSON.");

        String system = "You are a professional writing analyst. Extract voice and style patterns from social media posts.";
        return callClaude(system, sb.toString(), 512);
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
                    String hook = node.path("hook").isNull() ? null : node.path("hook").asText(null);
                    draft.setHook(hook);
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
