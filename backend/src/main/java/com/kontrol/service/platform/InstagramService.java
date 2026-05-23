package com.kontrol.service.platform;

import org.springframework.stereotype.Service;

// BACKEND-AGENT: Meta Graph API — posts + stories for Instagram
@Service
public class InstagramService {
    public void publishPost(String accountId, String accessToken, String content, String mediaUrl) {
        throw new UnsupportedOperationException("Sprint 2");
    }
    public void publishStory(String accountId, String accessToken, String mediaUrl, String overlayText) {
        throw new UnsupportedOperationException("Sprint 2");
    }
}
