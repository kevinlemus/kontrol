package com.kontrol.service.platform;

import org.springframework.stereotype.Service;

// BACKEND-AGENT: YouTube Data API v3 — shorts upload only
@Service
public class YouTubeService {
    public void uploadShort(String accessToken, String videoUrl, String title, String description) {
        throw new UnsupportedOperationException("Sprint 2");
    }
}
