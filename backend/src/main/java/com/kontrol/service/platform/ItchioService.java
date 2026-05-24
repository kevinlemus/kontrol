package com.kontrol.service.platform;

import com.kontrol.dto.PublishResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * itch.io devlog publishing via itch.io Butler API.
 *
 * TO ENABLE:
 * 1. Get API key from: https://itch.io/user/settings/api-keys
 * 2. Note your game ID from the game dashboard URL
 * 3. Add to backend/.env:
 *    ITCHIO_API_KEY=your_api_key
 *    ITCHIO_GAME_ID=your_game_id
 *
 * Docs: https://itch.io/docs/butler/
 */
@Service
@Slf4j
public class ItchioService {

    /*
     * SETUP REQUIRED (no OAuth — static API key):
     * 1. Go to: https://itch.io/user/settings/api-keys
     * 2. Click "Generate new API key"
     * 3. Add to backend/.env: ITCHIO_API_KEY and ITCHIO_GAME_ID
     * 4. No OAuth flow needed — API key grants direct access
     * DOCS: https://itch.io/docs/api/overview
     */

    // TODO: Add ITCHIO_API_KEY and ITCHIO_GAME_ID to backend/.env
    @Value("${itchio.api.key:}") private String apiKey;

    private final WebClient webClient;

    public ItchioService(WebClient.Builder b) { this.webClient = b.build(); }

    public PublishResult publishUpdate(String content) {
        if (apiKey.isBlank()) {
            log.info("itch.io not configured — add ITCHIO_API_KEY to .env");
            return notConfigured("IT", "ITCHIO_API_KEY + ITCHIO_GAME_ID");
        }
        // TODO: itch.io Butler API for devlog posts.
        // https://itch.io/docs/butler/
        // game_id comes from .env ITCHIO_GAME_ID
        return notConfigured("IT", "implementation pending — credentials ready");
    }

    private PublishResult notConfigured(String pid, String missing) {
        return PublishResult.builder().platformId(pid).success(false)
            .errorMessage("Not configured — add " + missing + " to .env").build();
    }
}
