package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Instagram publishing via Meta Graph API.
 *
 * TO ENABLE:
 * 1. Create Meta Developer app: https://developers.facebook.com/apps/
 * 2. Add to backend/.env:
 *    META_APP_ID=your_app_id
 *    META_APP_SECRET=your_app_secret
 * 3. Connect account in Settings -> Instagram -> the OAuth flow saves access_token to platform_configs
 *
 * Docs: https://developers.facebook.com/docs/instagram-api/content-publishing
 */
@Service
@Slf4j
public class InstagramService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Create app at: https://developers.facebook.com/apps/
     * 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/instagram/callback
     * 3. Add to backend/.env: META_APP_ID and META_APP_SECRET
     * 4. In Settings → Connect Instagram, user is redirected through the OAuth flow
     *    which calls /api/v1/oauth/instagram/authorize → platform OAuth → callback
     *    → token saved to platform_configs → publishing is now active
     */

    // TODO: Add META_APP_ID and META_APP_SECRET to backend/.env
    @Value("${meta.app.id:}") private String appId;
    @Value("${meta.app.secret:}") private String appSecret;

    private final WebClient webClient;

    public InstagramService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content, String mediaUrl) {
        if (appId.isBlank()) {
            log.info("Instagram not configured — add META_APP_ID to .env");
            return notConfigured("IG", "META_APP_ID + META_APP_SECRET");
        }
        // TODO: Implement two-step publish:
        // 1. POST /{ig-user-id}/media with image_url={mediaUrl}&caption={content}&access_token={token}
        // 2. POST /{ig-user-id}/media_publish with creation_id={from step 1}&access_token={token}
        // access_token comes from platform_configs where project_id=? AND platform='IG'
        return notConfigured("IG", "implementation pending — credentials ready");
    }

    public PublishResult publishStory(String mediaUrl, String overlayText) {
        // TODO: Same as publishPost but media_type=STORIES
        return notConfigured("IG", "META_APP_ID + META_APP_SECRET");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
