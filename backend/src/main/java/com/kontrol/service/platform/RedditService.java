package com.kontrol.service.platform;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

// BACKEND-AGENT: Reddit API — submit posts + fetch subreddit posts for monitoring
@Service
public class RedditService {
    public void submitPost(String subreddit, String title, String content) {
        throw new UnsupportedOperationException("Sprint 2");
    }
    public void submitComment(String postId, String commentText) {
        throw new UnsupportedOperationException("Sprint 2");
    }
    public List<Map<String, Object>> fetchRecentPosts(String subreddit, int limit) {
        throw new UnsupportedOperationException("Sprint 2");
    }
}
