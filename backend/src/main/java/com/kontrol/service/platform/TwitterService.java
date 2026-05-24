package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * X / Twitter publishing via Twitter API v2.
 *
 * TO ENABLE:
 * 1. Apply at https://developer.twitter.com — Elevated access required for posting
 * 2. Add to backend/.env:
 *    TWITTER_API_KEY=your_api_key
 *    TWITTER_API_SECRET=your_api_secret
 *    TWITTER_ACCESS_TOKEN=your_access_token
 *    TWITTER_ACCESS_SECRET=your_access_token_secret
 *
 * Note: Requires OAuth 1.0a signature headers (HMAC-SHA1).
 * Docs: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 */
@Service
@Slf4j
public class TwitterService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Create project+app at: https://developer.twitter.com/en/portal/dashboard
     * 2. Enable OAuth 2.0 in App Settings
     * 3. Set redirect URI to: http://localhost:8080/api/v1/oauth/twitter/callback
     * 4. Add to backend/.env: TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET (for OAuth 2.0)
     *    Also add: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
     *    (for OAuth 1.0a, used by older v1.1 endpoints)
     * 5. Requires Elevated access on the developer portal
     * 6. OAuth flow: /api/v1/oauth/twitter/authorize → X → callback → token saved
     */

    // TODO: Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET to backend/.env
    @Value("${twitter.api.key:}") private String apiKey;
    @Value("${twitter.api.secret:}") private String apiSecret;
    @Value("${twitter.access.token:}") private String accessToken;
    @Value("${twitter.access.secret:}") private String accessSecret;

    private final WebClient webClient;

    public TwitterService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content) {
        if (apiKey.isBlank()) {
            log.info("Twitter/X not configured — add TWITTER_API_KEY to .env");
            return notConfigured("X", "TWITTER_API_KEY + TWITTER_API_SECRET + TWITTER_ACCESS_TOKEN + TWITTER_ACCESS_SECRET");
        }
        // TODO: X API v2 POST https://api.twitter.com/2/tweets
        // Requires OAuth 1.0a signature headers (complex — see OAuth 1.0a spec):
        // Authorization: OAuth oauth_consumer_key="...", oauth_nonce="...",
        //   oauth_signature="...", oauth_signature_method="HMAC-SHA1",
        //   oauth_timestamp="...", oauth_token="...", oauth_version="1.0"
        return notConfigured("X", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
