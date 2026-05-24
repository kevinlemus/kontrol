package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Game Jolt post publishing via Game Jolt Game API v1.
 *
 * TO ENABLE:
 * 1. Go to Game Jolt dashboard -> your game -> API Settings
 * 2. Add to backend/.env:
 *    GAMEJOLT_GAME_ID=your_game_id
 *    GAMEJOLT_API_KEY=your_private_key
 *
 * Docs: https://gamejolt.com/game-api/doc
 */
@Service
@Slf4j
public class GameJoltService {

    /*
     * SETUP REQUIRED (no OAuth — HMAC signing):
     * 1. Go to: https://gamejolt.com/dashboard → your game → API Settings
     * 2. Copy Game ID and Private Key
     * 3. Add to backend/.env: GAMEJOLT_GAME_ID and GAMEJOLT_PRIVATE_KEY
     * 4. No OAuth flow — requests are signed with HMAC-MD5 using your private key
     * DOCS: https://gamejolt.com/game-api/doc
     */

    // TODO: Add GAMEJOLT_API_KEY and GAMEJOLT_GAME_ID to backend/.env
    @Value("${gamejolt.api.key:}") private String apiKey;

    private final WebClient webClient;

    public GameJoltService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishUpdate(String content) {
        if (apiKey.isBlank()) {
            log.info("Game Jolt not configured — add GAMEJOLT_API_KEY to .env");
            return notConfigured("GJ", "GAMEJOLT_GAME_ID + GAMEJOLT_API_KEY");
        }
        // TODO: Game Jolt Game API v1.
        // https://gamejolt.com/game-api/doc
        // game_id comes from .env GAMEJOLT_GAME_ID
        return notConfigured("GJ", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
