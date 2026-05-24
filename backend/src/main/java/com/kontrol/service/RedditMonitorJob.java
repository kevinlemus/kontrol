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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedditMonitorJob {

    // TODO: Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to backend/.env
    @Value("${reddit.client.id:}") private String clientId;
    @Value("${reddit.client.secret:}") private String clientSecret;
    @Value("${reddit.username:}") private String username;
    @Value("${reddit.password:}") private String password;

    private final SubredditMonitorRepository monitorRepo;
    private final RedditSuggestionRepository suggestionRepo;
    private final ProjectRepository projectRepo;
    private final ClaudeService claudeService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final UserSettingsService userSettingsService;

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000)
    public void runMonitor() {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            log.info("Reddit credentials not set — skipping monitor. Add REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET to .env");
            return;
        }
        List<SubredditMonitor> monitors = monitorRepo.findByActiveTrue();
        if (monitors.isEmpty()) return;

        String token = getAccessToken();
        if (token == null) { log.error("Failed to get Reddit access token"); return; }

        for (SubredditMonitor m : monitors) {
            try { processSubreddit(m, token); }
            catch (Exception e) { log.error("Error checking r/{}: {}", m.getSubreddit(), e.getMessage(), e); }
        }
    }

    private String getAccessToken() {
        try {
            String creds = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());
            String resp = webClientBuilder.build().post()
                .uri("https://www.reddit.com/api/v1/access_token")
                .header("Authorization", "Basic " + creds)
                .header("User-Agent", "Kontrol/0.1 by " + username)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("grant_type=password&username=" + username + "&password=" + password)
                .retrieve().bodyToMono(String.class).block();
            return objectMapper.readTree(resp).path("access_token").asText(null);
        } catch (Exception e) { log.error("Reddit auth error: {}", e.getMessage()); return null; }
    }

    private void processSubreddit(SubredditMonitor m, String token) throws Exception {
        String resp = webClientBuilder.build().get()
            .uri("https://oauth.reddit.com/r/" + m.getSubreddit() + "/new?limit=25")
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", "Kontrol/0.1 by " + username)
            .retrieve().bodyToMono(String.class).block();

        JsonNode posts = objectMapper.readTree(resp).path("data").path("children");
        var project = projectRepo.findById(m.getProjectId()).orElse(null);
        if (project == null) return;

        UserContextDto userContext = userSettingsService.getUserContext();

        String ctx = String.format("Project: %s — %s. Audience: %s. Vibe: %s",
            project.getName(), nvl(project.getWhatItIs()), nvl(project.getWhoItsFor()), nvl(project.getVibe()));

        int added = 0;
        for (JsonNode child : posts) {
            JsonNode p = child.path("data");
            String postId = p.path("id").asText();
            if (suggestionRepo.existsByRedditPostId(postId)) continue;

            String title = p.path("title").asText();
            String body = p.path("selftext").asText("");
            String url = "https://reddit.com" + p.path("permalink").asText();
            String comment = claudeService.generateRedditComment(userContext, ctx, m.getSubreddit(), title, body);

            suggestionRepo.save(RedditSuggestion.builder()
                .projectId(m.getProjectId())
                .subreddit(m.getSubreddit())
                .redditPostId(postId)
                .redditPostTitle(title)
                .redditPostUrl(url)
                .suggestedComment(comment)
                .status("pending")
                .build());
            added++;
        }
        m.setLastCheckedAt(OffsetDateTime.now());
        monitorRepo.save(m);
        log.info("r/{}: {} new suggestions", m.getSubreddit(), added);
    }

    private String nvl(String s) { return s != null ? s : "N/A"; }
}
