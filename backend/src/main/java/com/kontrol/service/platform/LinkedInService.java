package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * LinkedIn publishing via LinkedIn API v2 (UGC Posts).
 *
 * TO ENABLE:
 * 1. Create app: https://www.linkedin.com/developers/apps
 * 2. Request r_liteprofile, w_member_social permissions
 * 3. Add to backend/.env:
 *    LINKEDIN_CLIENT_ID=your_client_id
 *    LINKEDIN_CLIENT_SECRET=your_client_secret
 *
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api
 */
@Service
@Slf4j
public class LinkedInService {

    /*
     * OAUTH SETUP REQUIRED:
     * 1. Create app at: https://www.linkedin.com/developers/apps
     * 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/linkedin/callback
     * 3. Add to backend/.env: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET
     * 4. Request permissions: r_liteprofile, w_member_social
     * 5. OAuth flow: /api/v1/oauth/linkedin/authorize → LinkedIn → callback → token saved
     */

    // TODO: Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to backend/.env
    @Value("${linkedin.client.id:}") private String clientId;
    @Value("${linkedin.client.secret:}") private String clientSecret;

    private final WebClient webClient;

    public LinkedInService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishPost(String content) {
        if (clientId.isBlank()) {
            log.info("LinkedIn not configured — add LINKEDIN_CLIENT_ID to .env");
            return notConfigured("LI", "LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET");
        }
        // TODO: LinkedIn API v2 UGC Posts.
        // POST https://api.linkedin.com/v2/ugcPosts
        // author: "urn:li:person:{accountId}"
        // access_token comes from platform_configs where project_id=? AND platform='LI'
        return notConfigured("LI", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
