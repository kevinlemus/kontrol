package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

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

    public PublishResult publishPost(String content, String subreddit) {
        if (clientId.isBlank()) {
            log.info("Reddit not configured — add REDDIT_CLIENT_ID to .env");
            return notConfigured("RD", "REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET + REDDIT_USERNAME + REDDIT_PASSWORD");
        }
        // TODO: Reddit OAuth2 password flow:
        // 1. POST https://www.reddit.com/api/v1/access_token with password grant
        // 2. POST https://oauth.reddit.com/api/submit with:
        //    sr={subreddit}, kind=self, title={derived from content}, text={content}
        //    Authorization: Bearer {accessToken}
        log.info("Reddit publish to r/{} — implementation pending", subreddit);
        return notConfigured("RD", "implementation pending — credentials ready");
    }

    /** @deprecated Use publishPost(content, subreddit) */
    public PublishResult publishPost(String content) {
        return publishPost(content, "self");
    }

    /**
     * Update the engagement score for a subreddit monitor based on post metrics.
     *
     * TODO: Wire this up when Reddit post metrics polling is implemented.
     * Call from a @Scheduled job that periodically checks post upvotes/comments
     * via GET https://oauth.reddit.com/by_id/t3_{platformPostId}
     *
     * @param subredditMonitorId The SubredditMonitor row ID to update
     * @param upvotes            Current upvote count from Reddit API
     * @param comments           Current comment count from Reddit API
     */
    public void updateEngagementScore(UUID subredditMonitorId, int upvotes, int comments) {
        // TODO: Implement engagement score calculation
        // Suggested formula: score = upvotes + (comments * 3)
        // This weights comments more heavily as they indicate deeper engagement
        log.info("Engagement score update for monitor {} — upvotes={}, comments={} (not yet implemented)",
            subredditMonitorId, upvotes, comments);
    }

    /**
     * Mark a subreddit monitor as posted-to (updates lastPostedAt).
     * Call this after a successful Reddit post publish.
     */
    public void markPostedToSubreddit(UUID subredditMonitorId, String platformPostId) {
        // TODO: Implement — update SubredditMonitor.lastPostedAt = now
        // Also store platformPostId in SubredditMonitor.extraData for later engagement polling
        log.info("Mark subreddit monitor {} as posted — platformPostId: {}", subredditMonitorId, platformPostId);
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
