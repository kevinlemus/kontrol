package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Steam game announcements via Steamworks Partner API.
 *
 * TO ENABLE:
 * 1. Requires Steamworks partner account: https://partner.steamgames.com
 * 2. Add to backend/.env:
 *    STEAM_PARTNER_KEY=your_partner_key
 *    STEAM_APP_ID=your_game_app_id
 *
 * Docs: https://partner.steamgames.com/doc/webapi
 */
@Service
@Slf4j
public class SteamService {

    /*
     * SETUP REQUIRED (no OAuth — static key):
     * 1. Register as Steamworks partner at: https://partner.steamgames.com
     * 2. Get Publisher Web API Key from: Users & Permissions → Manage Groups → API Keys
     * 3. Add to backend/.env: STEAM_PARTNER_KEY and STEAM_APP_ID
     * 4. No OAuth flow needed — partner key grants direct API access
     * DOCS: https://partner.steamgames.com/doc/webapi_overview
     */

    // TODO: Add STEAM_PARTNER_KEY and STEAM_APP_ID to backend/.env
    @Value("${steam.partner.key:}") private String partnerKey;

    private final WebClient webClient;

    public SteamService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishUpdate(String content) {
        if (partnerKey.isBlank()) {
            log.info("Steam not configured — add STEAM_PARTNER_KEY to .env");
            return notConfigured("ST", "STEAM_PARTNER_KEY + STEAM_APP_ID");
        }
        // TODO: Steamworks Partner API for announcements.
        // Requires partner account and approved app.
        // POST https://partner.steam-api.com/ISteamPublishedItemVoting/...
        // Or use the Store/Community announcement endpoint via Steamworks Web API
        return notConfigured("ST", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
