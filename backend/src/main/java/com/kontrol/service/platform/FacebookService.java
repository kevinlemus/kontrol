package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Facebook page publishing via Meta Graph API.
 *
 * TO ENABLE:
 * 1. Use the same Meta Developer app as Instagram
 * 2. Add pages_manage_posts permission in App Review
 * 3. Add to backend/.env:
 *    META_APP_ID=your_app_id
 *    META_APP_SECRET=your_app_secret
 *    FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
 *    FACEBOOK_PAGE_ID=your_page_id
 *
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/feed/#publish
 */
@Service
@Slf4j
public class FacebookService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Same Meta app as Instagram — https://developers.facebook.com/apps/
     * 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/facebook/callback
     * 3. Add to backend/.env: META_APP_ID and META_APP_SECRET
     * 4. Add permission: pages_manage_posts (requires App Review for production)
     * 5. OAuth flow: /api/v1/oauth/facebook/authorize → Facebook → callback → token saved
     * NOTE: Posting requires a Page Access Token (not user token) — fetched after auth
     */

    // TODO: Add META_APP_ID, META_APP_SECRET to backend/.env
    // Page access token and page ID come from platform_configs
    @Value("${meta.app.id:}") private String appId;

    private final WebClient webClient;

    public FacebookService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content) {
        if (appId.isBlank()) {
            log.info("Facebook not configured — add META_APP_ID to .env");
            return notConfigured("FB", "META_APP_ID + META_APP_SECRET + FACEBOOK_PAGE_ACCESS_TOKEN + FACEBOOK_PAGE_ID");
        }
        // TODO: Meta Graph API POST /{page-id}/feed
        // message={content}&access_token={pageToken}
        // pageToken and page-id come from platform_configs where project_id=? AND platform='FB'
        return notConfigured("FB", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
