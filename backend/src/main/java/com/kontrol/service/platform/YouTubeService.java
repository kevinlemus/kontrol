package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * YouTube publishing via YouTube Data API v3.
 *
 * TO ENABLE:
 * 1. Enable YouTube Data API v3 in Google Cloud Console: https://console.cloud.google.com
 * 2. Create OAuth 2.0 credentials (Web application type)
 * 3. Get refresh token via https://developers.google.com/oauthplayground
 *    (scope: https://www.googleapis.com/auth/youtube.upload)
 * 4. Add to backend/.env:
 *    YOUTUBE_CLIENT_ID=your_client_id
 *    YOUTUBE_CLIENT_SECRET=your_client_secret
 *    YOUTUBE_REFRESH_TOKEN=your_refresh_token
 *
 * Docs: https://developers.google.com/youtube/v3/docs/videos/insert
 */
@Service
@Slf4j
public class YouTubeService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Create project at: https://console.cloud.google.com
     * 2. Enable: YouTube Data API v3 in APIs & Services → Library
     * 3. Create OAuth 2.0 credentials (Web application)
     * 4. Set redirect URI to: http://localhost:8080/api/v1/oauth/youtube/callback
     * 5. Add to backend/.env: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET
     * 6. OAuth flow: /api/v1/oauth/youtube/authorize → Google → callback → token saved
     * NOTE: YouTube community posts require channel with 500+ subscribers
     */

    // TODO: Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN to backend/.env
    @Value("${youtube.client.id:}") private String clientId;
    @Value("${youtube.client.secret:}") private String clientSecret;

    private final WebClient webClient;

    public YouTubeService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content, String postType) {
        if (clientId.isBlank()) {
            log.info("YouTube not configured — add YOUTUBE_CLIENT_ID to .env");
            return notConfigured("YT", "YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET + YOUTUBE_REFRESH_TOKEN");
        }
        // TODO: YouTube Data API v3 community posts or video upload.
        // Requires refresh token from OAuth playground to get access_token.
        // For community posts: POST https://www.googleapis.com/youtube/v3/posts
        // For Shorts upload: POST https://www.googleapis.com/upload/youtube/v3/videos
        return notConfigured("YT", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
