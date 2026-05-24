package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Reddit publishing via Reddit OAuth2 API.
 *
 * TO ENABLE:
 * 1. Create app at https://www.reddit.com/prefs/apps (type: script)
 * 2. Add to backend/.env:
 *    REDDIT_CLIENT_ID=your_client_id
 *    REDDIT_CLIENT_SECRET=your_client_secret
 *    REDDIT_USERNAME=your_reddit_username
 *    REDDIT_PASSWORD=your_reddit_password
 *
 * Docs: https://www.reddit.com/dev/api/
 */
@Service
@Slf4j
public class RedditService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Go to: https://www.reddit.com/prefs/apps → Create app (type: web app)
     * 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/reddit/callback
     * 3. Add to backend/.env: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
     * 4. OAuth flow: /api/v1/oauth/reddit/authorize → Reddit → callback → token saved
     * NOTE: For the Reddit Monitor job, REDDIT_USERNAME + REDDIT_PASSWORD are also needed
     *       (script-type app credentials for the automated monitoring flow)
     */

    // TODO: Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to backend/.env
    @Value("${reddit.client.id:}") private String clientId;
    @Value("${reddit.client.secret:}") private String clientSecret;
    @Value("${reddit.username:}") private String username;
    @Value("${reddit.password:}") private String password;

    private final WebClient webClient;

    public RedditService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content) {
        if (clientId.isBlank()) {
            log.info("Reddit not configured — add REDDIT_CLIENT_ID to .env");
            return notConfigured("RD", "REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET + REDDIT_USERNAME + REDDIT_PASSWORD");
        }
        // TODO: Reddit OAuth2 password flow then POST to https://oauth.reddit.com/api/submit
        // Requires subreddit target — derive from post extra_data or platform_configs
        return notConfigured("RD", "implementation pending — credentials ready");
    }

    public PublishResult postComment(String threadUrl, String comment) {
        if (clientId.isBlank()) {
            log.info("Reddit not configured — add REDDIT_CLIENT_ID to .env");
            return notConfigured("RD", "REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET + REDDIT_USERNAME + REDDIT_PASSWORD");
        }
        // TODO: Reddit OAuth2 password flow then POST to https://oauth.reddit.com/api/comment
        // thing_id = thread fullname (e.g. t3_abc123), text = comment body
        return notConfigured("RD", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
