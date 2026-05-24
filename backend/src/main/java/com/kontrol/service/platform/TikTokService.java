package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * TikTok publishing via Content Posting API v2.
 *
 * TO ENABLE:
 * 1. Apply for developer access: https://developers.tiktok.com/apps/ (approval ~2 weeks)
 * 2. Add to backend/.env:
 *    TIKTOK_CLIENT_KEY=your_client_key
 *    TIKTOK_CLIENT_SECRET=your_client_secret
 *
 * Note: TikTok Content Posting API requires video files only — no text-only posts.
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 */
@Service
@Slf4j
public class TikTokService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Create app at: https://developers.tiktok.com/apps/
     * 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/tiktok/callback
     * 3. Add to backend/.env: TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET
     * 4. Apply for Content Posting API access (required for video uploads, ~2 week review)
     * 5. OAuth flow: /api/v1/oauth/tiktok/authorize → TikTok → callback → token saved
     * NOTE: TikTok only supports video content — text-only posts not available via API
     */

    // TODO: Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to backend/.env
    @Value("${tiktok.client.key:}") private String tiktokClientKey;
    @Value("${tiktok.client.secret:}") private String tiktokClientSecret;

    private final WebClient webClient;

    public TikTokService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content, String videoUrl) {
        if (tiktokClientKey.isBlank()) {
            log.info("TikTok not configured — add TIKTOK_CLIENT_KEY to .env");
            return notConfigured("TT", "TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET");
        }
        // TODO: TikTok Content Posting API v2, requires developer approval.
        // POST https://open.tiktokapis.com/v2/post/publish/video/init/
        // Note: video files only, no text-only posts.
        return notConfigured("TT", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
