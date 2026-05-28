package com.kontrol.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.model.GlobalPlatformAccount;
import com.kontrol.model.PlatformConfig;
import com.kontrol.repository.GlobalPlatformAccountRepository;
import com.kontrol.repository.PlatformConfigRepository;
import com.kontrol.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * OAuth flow controller for all 10 platforms.
 *
 * FLOW:
 *   1. Frontend redirects user to GET /api/v1/oauth/{platform}/authorize?project_id={uuid}
 *      (project_id is optional — omit to connect a global account)
 *   2. This controller builds the platform OAuth URL and redirects the browser there
 *   3. Platform redirects back to GET /api/v1/oauth/{platform}/callback?code=...&state=...
 *   4. This controller exchanges the code for a token
 *   5. Token saved to global_platform_accounts (if no project_id) or platform_configs
 *   6. Browser redirected to {frontendUrl}/settings?connected={platform}
 *
 * TO ACTIVATE: Add credentials for each platform to backend/.env (see comments per endpoint)
 */
@RestController
@RequestMapping("/api/v1/oauth")
@RequiredArgsConstructor
@Slf4j
public class OAuthController {

    private final PlatformConfigRepository platformConfigRepository;
    private final GlobalPlatformAccountRepository globalPlatformAccountRepository;
    private final ProjectRepository projectRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    // ── Meta (Instagram + Facebook) ──────────────────────────────────────────

    // TODO: Add META_APP_ID and META_APP_SECRET to backend/.env
    // Create app at: https://developers.facebook.com/apps/
    // Required permissions: instagram_basic, instagram_content_publish, pages_manage_posts
    @Value("${meta.app.id:}") private String metaAppId;
    @Value("${meta.app.secret:}") private String metaAppSecret;

    @GetMapping("/instagram/authorize")
    public ResponseEntity<Void> instagramAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Create Meta app at https://developers.facebook.com/apps/
        // 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/instagram/callback
        // 3. Add META_APP_ID and META_APP_SECRET to backend/.env
        // 4. The callback below handles token exchange automatically
        if (metaAppId.isBlank()) return credentialsMissing("META_APP_ID");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://www.facebook.com/v18.0/dialog/oauth")
            .queryParam("client_id", metaAppId)
            .queryParam("redirect_uri", getRedirectUri("INSTAGRAM_REDIRECT_URI", "/api/v1/oauth/instagram/callback"))
            .queryParam("scope", "instagram_basic,instagram_content_publish,pages_manage_posts,pages_read_engagement")
            .queryParam("state", state)
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/instagram/callback")
    public ResponseEntity<Void> instagramCallback(@RequestParam("code") String code,
                                                   @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add META_APP_ID + META_APP_SECRET to .env
        if (metaAppId.isBlank()) return credentialsMissing("META_APP_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            // Exchange code for short-lived token
            String tokenResp = webClientBuilder.build().get()
                .uri("https://graph.facebook.com/v18.0/oauth/access_token"
                    + "?client_id=" + metaAppId
                    + "&client_secret=" + metaAppSecret
                    + "&redirect_uri=" + getRedirectUri("INSTAGRAM_REDIRECT_URI", "/api/v1/oauth/instagram/callback")
                    + "&code=" + code)
                .retrieve().bodyToMono(String.class).block();
            JsonNode tokenJson = objectMapper.readTree(tokenResp);
            String accessToken = tokenJson.path("access_token").asText();

            // Exchange for long-lived token
            String longLivedResp = webClientBuilder.build().get()
                .uri("https://graph.facebook.com/v18.0/oauth/access_token"
                    + "?grant_type=fb_exchange_token"
                    + "&client_id=" + metaAppId
                    + "&client_secret=" + metaAppSecret
                    + "&fb_exchange_token=" + accessToken)
                .retrieve().bodyToMono(String.class).block();
            JsonNode longLived = objectMapper.readTree(longLivedResp);
            String finalToken = longLived.path("access_token").asText(accessToken);

            // Fetch Facebook name for display as account handle
            String meResp = webClientBuilder.build().get()
                .uri("https://graph.facebook.com/v18.0/me?fields=id,name&access_token=" + finalToken)
                .retrieve().bodyToMono(String.class).block();
            JsonNode me = objectMapper.readTree(meResp);
            String fbName = me.path("name").asText(null);

            saveToken(projectIdOrGlobal, "IG", finalToken, null, fbName);
            log.info("Instagram OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("instagram");
        } catch (Exception e) {
            log.error("Instagram OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("instagram");
        }
    }

    // ── Facebook ─────────────────────────────────────────────────────────────

    @GetMapping("/facebook/authorize")
    public ResponseEntity<Void> facebookAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Same Meta app as Instagram — https://developers.facebook.com/apps/
        // 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/facebook/callback
        // 3. Add META_APP_ID and META_APP_SECRET to backend/.env
        // 4. Add pages_manage_posts permission to the app
        if (metaAppId.isBlank()) return credentialsMissing("META_APP_ID");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://www.facebook.com/v18.0/dialog/oauth")
            .queryParam("client_id", metaAppId)
            .queryParam("redirect_uri", getRedirectUri("FACEBOOK_REDIRECT_URI", "/api/v1/oauth/facebook/callback"))
            .queryParam("scope", "pages_manage_posts,pages_read_engagement,pages_show_list")
            .queryParam("state", state)
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/facebook/callback")
    public ResponseEntity<Void> facebookCallback(@RequestParam("code") String code,
                                                  @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add META_APP_ID + META_APP_SECRET to .env
        if (metaAppId.isBlank()) return credentialsMissing("META_APP_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            String tokenResp = webClientBuilder.build().get()
                .uri("https://graph.facebook.com/v18.0/oauth/access_token"
                    + "?client_id=" + metaAppId
                    + "&client_secret=" + metaAppSecret
                    + "&redirect_uri=" + getRedirectUri("FACEBOOK_REDIRECT_URI", "/api/v1/oauth/facebook/callback")
                    + "&code=" + code)
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp);
            String token = json.path("access_token").asText();

            // Fetch Facebook name for display as account handle
            String meResp = webClientBuilder.build().get()
                .uri("https://graph.facebook.com/v18.0/me?fields=id,name&access_token=" + token)
                .retrieve().bodyToMono(String.class).block();
            JsonNode me = objectMapper.readTree(meResp);
            String fbName = me.path("name").asText(null);

            saveToken(projectIdOrGlobal, "FB", token, null, fbName);
            log.info("Facebook OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("facebook");
        } catch (Exception e) {
            log.error("Facebook OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("facebook");
        }
    }

    // ── TikTok ───────────────────────────────────────────────────────────────

    // TODO: Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to backend/.env
    // Create app at: https://developers.tiktok.com/apps/
    // NOTE: Content Posting API requires separate developer approval (~2 weeks)
    @Value("${tiktok.client.key:}") private String tiktokClientKey;
    @Value("${tiktok.client.secret:}") private String tiktokClientSecret;

    @GetMapping("/tiktok/authorize")
    public ResponseEntity<Void> tiktokAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Create TikTok Developer app at https://developers.tiktok.com/apps/
        // 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/tiktok/callback
        // 3. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to backend/.env
        // 4. Apply for Content Posting API access (required for video uploads)
        if (tiktokClientKey.isBlank()) return credentialsMissing("TIKTOK_CLIENT_KEY");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://www.tiktok.com/v2/auth/authorize/")
            .queryParam("client_key", tiktokClientKey)
            .queryParam("scope", "user.info.basic,video.publish,video.upload")
            .queryParam("response_type", "code")
            .queryParam("redirect_uri", getRedirectUri("TIKTOK_REDIRECT_URI", "/api/v1/oauth/tiktok/callback"))
            .queryParam("state", state)
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/tiktok/callback")
    public ResponseEntity<Void> tiktokCallback(@RequestParam("code") String code,
                                                @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET to .env
        if (tiktokClientKey.isBlank()) return credentialsMissing("TIKTOK_CLIENT_KEY");
        try {
            String projectIdOrGlobal = decodeState(state);
            String tokenResp = webClientBuilder.build().post()
                .uri("https://open.tiktokapis.com/v2/oauth/token/")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("client_key=" + tiktokClientKey
                    + "&client_secret=" + tiktokClientSecret
                    + "&code=" + code
                    + "&grant_type=authorization_code"
                    + "&redirect_uri=" + getRedirectUri("TIKTOK_REDIRECT_URI", "/api/v1/oauth/tiktok/callback"))
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp).path("data");
            String accessToken = json.path("access_token").asText();
            String refreshToken = json.path("refresh_token").asText(null);
            String openId = json.path("open_id").asText(null);
            saveToken(projectIdOrGlobal, "TT", accessToken, refreshToken, openId);
            log.info("TikTok OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("tiktok");
        } catch (Exception e) {
            log.error("TikTok OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("tiktok");
        }
    }

    // ── LinkedIn ─────────────────────────────────────────────────────────────

    // TODO: Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to backend/.env
    // Create app at: https://www.linkedin.com/developers/apps
    // Required permissions: r_liteprofile, w_member_social
    @Value("${linkedin.client.id:}") private String linkedinClientId;
    @Value("${linkedin.client.secret:}") private String linkedinClientSecret;

    @GetMapping("/linkedin/authorize")
    public ResponseEntity<Void> linkedinAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Create LinkedIn Developer app at https://www.linkedin.com/developers/apps
        // 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/linkedin/callback
        // 3. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to backend/.env
        // 4. Request: r_liteprofile, w_member_social permissions
        if (linkedinClientId.isBlank()) return credentialsMissing("LINKEDIN_CLIENT_ID");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://www.linkedin.com/oauth/v2/authorization")
            .queryParam("response_type", "code")
            .queryParam("client_id", linkedinClientId)
            .queryParam("redirect_uri", getRedirectUri("LINKEDIN_REDIRECT_URI", "/api/v1/oauth/linkedin/callback"))
            .queryParam("scope", "r_liteprofile w_member_social")
            .queryParam("state", state)
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/linkedin/callback")
    public ResponseEntity<Void> linkedinCallback(@RequestParam("code") String code,
                                                  @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET to .env
        if (linkedinClientId.isBlank()) return credentialsMissing("LINKEDIN_CLIENT_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            String tokenResp = webClientBuilder.build().post()
                .uri("https://www.linkedin.com/oauth/v2/accessToken")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("grant_type=authorization_code"
                    + "&code=" + code
                    + "&redirect_uri=" + getRedirectUri("LINKEDIN_REDIRECT_URI", "/api/v1/oauth/linkedin/callback")
                    + "&client_id=" + linkedinClientId
                    + "&client_secret=" + linkedinClientSecret)
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp);
            String accessToken = json.path("access_token").asText();
            // Fetch LinkedIn member ID (URN) for posting
            String profileResp = webClientBuilder.build().get()
                .uri("https://api.linkedin.com/v2/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve().bodyToMono(String.class).block();
            String memberId = objectMapper.readTree(profileResp).path("id").asText(null);
            saveToken(projectIdOrGlobal, "LI", accessToken, null, memberId);
            log.info("LinkedIn OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("linkedin");
        } catch (Exception e) {
            log.error("LinkedIn OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("linkedin");
        }
    }

    // ── Reddit ───────────────────────────────────────────────────────────────

    // TODO: Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to backend/.env
    // Create app at: https://www.reddit.com/prefs/apps (type: web app)
    // For posting comments as a user, OAuth2 is required (password flow only for scripts)
    @Value("${reddit.client.id:}") private String redditClientId;
    @Value("${reddit.client.secret:}") private String redditClientSecret;

    @GetMapping("/reddit/authorize")
    public ResponseEntity<Void> redditAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Go to https://www.reddit.com/prefs/apps → Create app (type: web app)
        // 2. Set redirect URI to: http://localhost:8080/api/v1/oauth/reddit/callback
        // 3. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to backend/.env
        if (redditClientId.isBlank()) return credentialsMissing("REDDIT_CLIENT_ID");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://www.reddit.com/api/v1/authorize")
            .queryParam("client_id", redditClientId)
            .queryParam("response_type", "code")
            .queryParam("state", state)
            .queryParam("redirect_uri", getRedirectUri("REDDIT_REDIRECT_URI", "/api/v1/oauth/reddit/callback"))
            .queryParam("duration", "permanent")
            .queryParam("scope", "submit,identity,read")
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/reddit/callback")
    public ResponseEntity<Void> redditCallback(@RequestParam("code") String code,
                                                @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET to .env
        if (redditClientId.isBlank()) return credentialsMissing("REDDIT_CLIENT_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            String creds = Base64.getEncoder()
                .encodeToString((redditClientId + ":" + redditClientSecret).getBytes());
            String tokenResp = webClientBuilder.build().post()
                .uri("https://www.reddit.com/api/v1/access_token")
                .header("Authorization", "Basic " + creds)
                .header("User-Agent", "Kontrol/0.1")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("grant_type=authorization_code&code=" + code
                    + "&redirect_uri=" + getRedirectUri("REDDIT_REDIRECT_URI", "/api/v1/oauth/reddit/callback"))
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp);
            String accessToken = json.path("access_token").asText();
            String refreshToken = json.path("refresh_token").asText(null);
            saveToken(projectIdOrGlobal, "RD", accessToken, refreshToken, null);
            log.info("Reddit OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("reddit");
        } catch (Exception e) {
            log.error("Reddit OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("reddit");
        }
    }

    // ── X / Twitter ──────────────────────────────────────────────────────────

    // TODO: Add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to backend/.env
    // Twitter v2 OAuth 2.0 with PKCE (preferred for web apps)
    // Get credentials at: https://developer.twitter.com/en/portal/dashboard
    // Required: Elevated access + OAuth 2.0 enabled in app settings
    @Value("${twitter.oauth2.client-id:}") private String twitterClientId;
    @Value("${twitter.oauth2.client-secret:}") private String twitterClientSecret;

    @GetMapping("/twitter/authorize")
    public ResponseEntity<Void> twitterAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Go to https://developer.twitter.com/en/portal/dashboard → Create Project + App
        // 2. Enable OAuth 2.0 in App Settings, set redirect URI to:
        //    http://localhost:8080/api/v1/oauth/twitter/callback
        // 3. Add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to backend/.env
        // 4. Note: Twitter also supports OAuth 1.0a for v1.1 API endpoints
        if (twitterClientId.isBlank()) return credentialsMissing("TWITTER_CLIENT_ID");
        String state = encodeState(projectId);
        // Note: Full PKCE flow requires code_verifier/code_challenge; simplified here for scaffold
        String url = UriComponentsBuilder
            .fromUriString("https://twitter.com/i/oauth2/authorize")
            .queryParam("response_type", "code")
            .queryParam("client_id", twitterClientId)
            .queryParam("redirect_uri", getRedirectUri("TWITTER_REDIRECT_URI", "/api/v1/oauth/twitter/callback"))
            .queryParam("scope", "tweet.read tweet.write users.read offline.access")
            .queryParam("state", state)
            .queryParam("code_challenge", "challenge") // TODO: implement PKCE properly
            .queryParam("code_challenge_method", "plain")
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/twitter/callback")
    public ResponseEntity<Void> twitterCallback(@RequestParam("code") String code,
                                                 @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET to .env
        if (twitterClientId.isBlank()) return credentialsMissing("TWITTER_CLIENT_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            String creds = Base64.getEncoder()
                .encodeToString((twitterClientId + ":" + twitterClientSecret).getBytes());
            String tokenResp = webClientBuilder.build().post()
                .uri("https://api.twitter.com/2/oauth2/token")
                .header("Authorization", "Basic " + creds)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("grant_type=authorization_code&code=" + code
                    + "&redirect_uri=" + getRedirectUri("TWITTER_REDIRECT_URI", "/api/v1/oauth/twitter/callback")
                    + "&code_verifier=challenge") // TODO: use real PKCE verifier
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp);
            String accessToken = json.path("access_token").asText();
            String refreshToken = json.path("refresh_token").asText(null);
            saveToken(projectIdOrGlobal, "X", accessToken, refreshToken, null);
            log.info("Twitter OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("twitter");
        } catch (Exception e) {
            log.error("Twitter OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("twitter");
        }
    }

    // ── YouTube ───────────────────────────────────────────────────────────────

    // TODO: Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to backend/.env
    // Create project at: https://console.cloud.google.com
    // Enable YouTube Data API v3 in APIs & Services → Library
    @Value("${youtube.client.id:}") private String youtubeClientId;
    @Value("${youtube.client.secret:}") private String youtubeClientSecret;

    @GetMapping("/youtube/authorize")
    public ResponseEntity<Void> youtubeAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // OAUTH SETUP REQUIRED:
        // 1. Create project at https://console.cloud.google.com
        // 2. Enable YouTube Data API v3
        // 3. Create OAuth 2.0 credentials, set redirect URI to:
        //    http://localhost:8080/api/v1/oauth/youtube/callback
        // 4. Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to backend/.env
        if (youtubeClientId.isBlank()) return credentialsMissing("YOUTUBE_CLIENT_ID");
        String state = encodeState(projectId);
        String url = UriComponentsBuilder
            .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", youtubeClientId)
            .queryParam("redirect_uri", getRedirectUri("YOUTUBE_REDIRECT_URI", "/api/v1/oauth/youtube/callback"))
            .queryParam("response_type", "code")
            .queryParam("scope", "https://www.googleapis.com/auth/youtube.force-ssl")
            .queryParam("access_type", "offline")
            .queryParam("state", state)
            .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/youtube/callback")
    public ResponseEntity<Void> youtubeCallback(@RequestParam("code") String code,
                                                 @RequestParam("state") String state) {
        // OAUTH SETUP REQUIRED: add YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET to .env
        if (youtubeClientId.isBlank()) return credentialsMissing("YOUTUBE_CLIENT_ID");
        try {
            String projectIdOrGlobal = decodeState(state);
            String tokenResp = webClientBuilder.build().post()
                .uri("https://oauth2.googleapis.com/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("code=" + code
                    + "&client_id=" + youtubeClientId
                    + "&client_secret=" + youtubeClientSecret
                    + "&redirect_uri=" + getRedirectUri("YOUTUBE_REDIRECT_URI", "/api/v1/oauth/youtube/callback")
                    + "&grant_type=authorization_code")
                .retrieve().bodyToMono(String.class).block();
            JsonNode json = objectMapper.readTree(tokenResp);
            String accessToken = json.path("access_token").asText();
            String refreshToken = json.path("refresh_token").asText(null);
            saveToken(projectIdOrGlobal, "YT", accessToken, refreshToken, null);
            log.info("YouTube OAuth complete for {}", projectIdOrGlobal);
            return redirectToSettings("youtube");
        } catch (Exception e) {
            log.error("YouTube OAuth callback error: {}", e.getMessage(), e);
            return redirectToSettingsError("youtube");
        }
    }

    // ── Steam ─────────────────────────────────────────────────────────────────

    // NOTE: Steam uses OpenID for authentication, not OAuth2. The partner API key
    // is a static key, not a per-user token. No OAuth callback needed — just add
    // STEAM_PARTNER_KEY and STEAM_APP_ID to .env.

    @GetMapping("/steam/authorize")
    public ResponseEntity<Map<String, String>> steamAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // SETUP REQUIRED:
        // 1. Register as a Steamworks partner at https://partner.steamgames.com
        // 2. Get your Publisher Web API Key from Users & Permissions → API Keys
        // 3. Add STEAM_PARTNER_KEY and STEAM_APP_ID to backend/.env
        // Steam does not use OAuth2 — your partner key grants API access directly.
        // No callback flow needed — credentials are static.
        return ResponseEntity.ok(Map.of(
            "message", "Steam uses a static Partner API key, not OAuth. Add STEAM_PARTNER_KEY to backend/.env",
            "docs", "https://partner.steamgames.com/doc/webapi_overview"
        ));
    }

    // ── itch.io ───────────────────────────────────────────────────────────────

    // TODO: Add ITCHIO_API_KEY to backend/.env
    // Get API key at: https://itch.io/user/settings/api-keys
    // itch.io uses static API keys, not OAuth2

    @GetMapping("/itchio/authorize")
    public ResponseEntity<Map<String, String>> itchioAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // SETUP REQUIRED:
        // 1. Go to https://itch.io/user/settings/api-keys
        // 2. Generate an API key
        // 3. Add ITCHIO_API_KEY and ITCHIO_GAME_ID to backend/.env
        // itch.io uses static API keys, not OAuth2. No callback flow needed.
        return ResponseEntity.ok(Map.of(
            "message", "itch.io uses a static API key. Add ITCHIO_API_KEY to backend/.env",
            "docs", "https://itch.io/docs/api/overview"
        ));
    }

    // ── Game Jolt ─────────────────────────────────────────────────────────────

    // TODO: Add GAMEJOLT_GAME_ID and GAMEJOLT_PRIVATE_KEY to backend/.env
    // Get credentials at: https://gamejolt.com/dashboard/games → your game → API Settings
    // Game Jolt uses game-level HMAC signing, not per-user OAuth

    @GetMapping("/gamejolt/authorize")
    public ResponseEntity<Map<String, String>> gamejoltAuthorize(
            @RequestParam(value = "project_id", required = false) String projectId) {
        // SETUP REQUIRED:
        // 1. Go to https://gamejolt.com/dashboard → your game → API Settings
        // 2. Copy your Game ID and Private Key
        // 3. Add GAMEJOLT_GAME_ID and GAMEJOLT_PRIVATE_KEY to backend/.env
        // Game Jolt API uses HMAC-MD5 signing with your private key — no OAuth flow.
        return ResponseEntity.ok(Map.of(
            "message", "Game Jolt uses HMAC signing with a static private key. Add GAMEJOLT_GAME_ID and GAMEJOLT_PRIVATE_KEY to backend/.env",
            "docs", "https://gamejolt.com/game-api/doc"
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Resolve redirect URI: env var takes precedence over localhost default.
     * On Render, set INSTAGRAM_REDIRECT_URI etc. to your production callback URL.
     */
    private String getRedirectUri(String envVar, String path) {
        String envValue = System.getenv(envVar);
        return (envValue != null && !envValue.isBlank())
            ? envValue
            : "http://localhost:8080" + path;
    }

    /**
     * Save a token either to global_platform_accounts (when projectIdOrGlobal == "global")
     * or to platform_configs (when projectIdOrGlobal is a valid UUID string).
     */
    private void saveToken(String projectIdOrGlobal, String platform, String accessToken,
                            String refreshToken, String accountId) {
        if ("global".equals(projectIdOrGlobal)) {
            Optional<GlobalPlatformAccount> existing =
                globalPlatformAccountRepository.findByPlatform(platform);
            GlobalPlatformAccount account = existing.orElseGet(() -> GlobalPlatformAccount.builder()
                .platform(platform)
                .build());
            account.setAccessToken(accessToken);
            if (refreshToken != null) account.setRefreshToken(refreshToken);
            if (accountId != null) account.setAccountId(accountId);
            globalPlatformAccountRepository.save(account);
            log.info("Saved {} token to global_platform_accounts", platform);
        } else {
            try {
                UUID projectUuid = UUID.fromString(projectIdOrGlobal);
                Optional<PlatformConfig> existing =
                    platformConfigRepository.findByProjectIdAndPlatform(projectUuid, platform);
                PlatformConfig config = existing.orElseGet(() -> PlatformConfig.builder()
                    .projectId(projectUuid)
                    .platform(platform)
                    .enabled(true)
                    .useGlobalAccount(false)
                    .build());
                config.setAccessToken(accessToken);
                if (refreshToken != null) config.setRefreshToken(refreshToken);
                if (accountId != null) config.setAccountId(accountId);
                platformConfigRepository.save(config);
                log.info("Saved {} token for project {}", platform, projectUuid);
            } catch (IllegalArgumentException e) {
                log.error("saveToken: invalid projectIdOrGlobal value '{}' for platform {}", projectIdOrGlobal, platform);
            }
        }
    }

    /**
     * Encode a projectId into Base64 URL-safe state parameter.
     * If projectId is null or blank, encodes the literal string "global".
     */
    private String encodeState(String projectId) {
        String value = (projectId != null && !projectId.isBlank()) ? projectId : "global";
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decodeState(String state) {
        return new String(Base64.getUrlDecoder().decode(state), StandardCharsets.UTF_8);
    }

    private String getFrontendUrl() {
        return allowedOrigins.split(",")[0].trim();
    }

    private ResponseEntity<Void> redirectToSettings(String platform) {
        String url = getFrontendUrl() + "/settings?connected=" + platform;
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    private ResponseEntity<Void> redirectToSettingsError(String platform) {
        String url = getFrontendUrl() + "/settings?error=" + platform;
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    private ResponseEntity<Void> credentialsMissing(String varName) {
        log.warn("OAuth attempted but {} not set in .env", varName);
        String url = getFrontendUrl() + "/settings?error=not_configured&missing=" + varName;
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }
}
