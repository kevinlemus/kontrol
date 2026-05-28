package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.model.RedditSuggestion;
import com.kontrol.model.SubredditMonitor;
import com.kontrol.dto.UserContextDto;
import com.kontrol.repository.ProjectRepository;
import com.kontrol.repository.RedditSuggestionRepository;
import com.kontrol.repository.SubredditMonitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedditMonitorJob {

    private static final String USER_AGENT = "Kontrol/1.0";
    private static final String REDDIT_BASE = "https://www.reddit.com";

    private final SubredditMonitorRepository monitorRepo;
    private final RedditSuggestionRepository suggestionRepo;
    private final ProjectRepository projectRepo;
    private final ClaudeService claudeService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final UserSettingsService userSettingsService;

    /** Runs every 2 hours — no credentials needed, uses public Reddit JSON API */
    @Scheduled(fixedRate = 2 * 60 * 60 * 1000)
    public void runMonitor() {
        List<SubredditMonitor> monitors = monitorRepo.findByActiveTrue();
        if (monitors.isEmpty()) return;
        log.info("Reddit monitor: checking {} subreddits via public JSON", monitors.size());
        for (SubredditMonitor m : monitors) {
            try { processSubreddit(m); }
            catch (Exception e) { log.error("Error checking r/{}: {}", m.getSubreddit(), e.getMessage(), e); }
        }
    }

    private void processSubreddit(SubredditMonitor m) throws Exception {
        String subreddit = m.getSubreddit().replaceFirst("^r/", "");

        String resp = webClientBuilder.build().get()
            .uri(REDDIT_BASE + "/r/" + subreddit + "/new.json?limit=25")
            .header("User-Agent", USER_AGENT)
            .retrieve().bodyToMono(String.class).block();

        JsonNode posts = objectMapper.readTree(resp).path("data").path("children");
        var project = projectRepo.findById(m.getProjectId()).orElse(null);
        if (project == null) return;

        UserContextDto userContext = userSettingsService.getUserContextFallback();
        String ctx = String.format("Project: %s — %s. Audience: %s",
            project.getName(), nvl(project.getWhatItIs()), nvl(project.getWhoItsFor()));

        int added = 0;
        for (JsonNode child : posts) {
            if (added >= 5) break; // max 5 new suggestions per run
            JsonNode p = child.path("data");
            String postId = p.path("id").asText();
            if (suggestionRepo.existsByRedditPostId(postId)) continue;

            String title = p.path("title").asText();
            String body = p.path("selftext").asText("");
            String permalink = p.path("permalink").asText();
            String url = REDDIT_BASE + permalink;

            // Fetch top comments so Claude can decide: top-level or reply?
            List<CommentData> topComments = fetchTopComments(subreddit, postId);

            CommentStrategy strategy = analyzeWithClaude(userContext, ctx, subreddit, title, body, topComments);
            if (strategy == null || strategy.commentText() == null || strategy.commentText().isBlank()) continue;

            suggestionRepo.save(RedditSuggestion.builder()
                .projectId(m.getProjectId())
                .subreddit("r/" + subreddit)
                .redditPostId(postId)
                .redditPostTitle(title)
                .redditPostUrl(url)
                .suggestedComment(strategy.commentText())
                .commentId(strategy.commentId())
                .isReply(strategy.isReply())
                .replyToUsername(strategy.replyToUsername())
                .replyToComment(strategy.replyToComment())
                .status("pending")
                .build());
            added++;

            // Respect Reddit rate limits between requests
            try { Thread.sleep(1500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
        }

        m.setLastCheckedAt(OffsetDateTime.now());
        monitorRepo.save(m);
        log.info("r/{}: {} new suggestions generated", subreddit, added);
    }

    private record CommentData(String id, String author, String body, int score) {}

    private record CommentStrategy(
        String commentText,
        boolean isReply,
        String commentId,
        String replyToUsername,
        String replyToComment
    ) {}

    private List<CommentData> fetchTopComments(String subreddit, String postId) {
        try {
            String resp = webClientBuilder.build().get()
                .uri(REDDIT_BASE + "/r/" + subreddit + "/comments/" + postId + ".json?limit=5&depth=1")
                .header("User-Agent", USER_AGENT)
                .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(resp);
            if (!root.isArray() || root.size() < 2) return List.of();

            JsonNode commentChildren = root.get(1).path("data").path("children");
            List<CommentData> comments = new ArrayList<>();
            for (JsonNode child : commentChildren) {
                if (!"t1".equals(child.path("kind").asText())) continue; // t1 = comment
                JsonNode d = child.path("data");
                String id = d.path("id").asText();
                String author = d.path("author").asText("[deleted]");
                String cbody = d.path("body").asText("");
                int score = d.path("score").asInt(0);
                if (cbody.isBlank() || "[deleted]".equals(cbody) || "[removed]".equals(cbody)) continue;
                comments.add(new CommentData(id, author, cbody, score));
                if (comments.size() >= 5) break;
            }
            comments.sort((a, b) -> Integer.compare(b.score(), a.score()));
            return comments;
        } catch (Exception e) {
            log.warn("Failed to fetch comments for post {}: {}", postId, e.getMessage());
            return List.of();
        }
    }

    private CommentStrategy analyzeWithClaude(UserContextDto userContext, String projectCtx,
                                               String subreddit, String title, String body,
                                               List<CommentData> topComments) {
        String systemPrompt = """
            You are a Reddit engagement expert helping a brand participate authentically in conversations.
            Given a Reddit post and its top comments, write an engagement comment and decide the best strategy.

            Return ONLY valid JSON — no markdown, no code blocks, no explanation:
            {
              "commentText": "the comment to post — authentic, helpful, adds value, not promotional",
              "isReply": false,
              "commentId": null,
              "replyToUsername": null,
              "replyToComment": null
            }

            If replying to a specific comment provides more value than a top-level comment, set isReply=true and fill in:
            - commentId: the exact id of the comment to reply to
            - replyToUsername: the author of that comment
            - replyToComment: first 120 characters of that comment

            Keep commentText authentic and human — never promotional or spammy.
            """;

        StringBuilder userMsg = new StringBuilder();
        userMsg.append("Project context: ").append(projectCtx).append("\n\n");
        userMsg.append("Subreddit: r/").append(subreddit).append("\n");
        userMsg.append("Post title: ").append(title).append("\n");
        if (!body.isBlank()) {
            userMsg.append("Post body: ")
                .append(body.length() > 400 ? body.substring(0, 400) + "..." : body)
                .append("\n");
        }
        if (!topComments.isEmpty()) {
            userMsg.append("\nTop comments (for context — optionally reply to one):\n");
            for (CommentData c : topComments) {
                String excerpt = c.body().length() > 150 ? c.body().substring(0, 150) + "..." : c.body();
                userMsg.append("- [id:").append(c.id()).append("] u/").append(c.author())
                    .append(" (score:").append(c.score()).append("): ").append(excerpt).append("\n");
            }
        } else {
            userMsg.append("\nNo comments yet — write a top-level comment.\n");
        }

        try {
            String raw = claudeService.callClaudeRaw(systemPrompt, userMsg.toString(), 600);
            String json = raw.trim();
            // Strip markdown code fences if Claude added them
            if (json.contains("```")) {
                int start = json.indexOf('{');
                int end = json.lastIndexOf('}');
                if (start >= 0 && end > start) json = json.substring(start, end + 1);
            }
            JsonNode node = objectMapper.readTree(json);
            String commentText = node.path("commentText").asText(null);
            boolean isReply = node.path("isReply").asBoolean(false);
            String commentId = node.path("commentId").isNull() ? null : node.path("commentId").asText(null);
            String replyToUser = node.path("replyToUsername").isNull() ? null : node.path("replyToUsername").asText(null);
            String replyToComment = node.path("replyToComment").isNull() ? null : node.path("replyToComment").asText(null);
            if (commentId != null && commentId.isBlank()) commentId = null;
            if (replyToUser != null && replyToUser.isBlank()) replyToUser = null;
            if (replyToComment != null && replyToComment.isBlank()) replyToComment = null;
            return new CommentStrategy(commentText, isReply, commentId, replyToUser, replyToComment);
        } catch (Exception e) {
            log.warn("Failed to parse Claude strategy response: {}", e.getMessage());
            return null;
        }
    }

    private String nvl(String s) { return s != null ? s : "N/A"; }
}
