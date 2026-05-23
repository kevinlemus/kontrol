package com.kontrol.service;

import org.springframework.stereotype.Service;

// BACKEND-AGENT: Implement this first.
// Calls claude-sonnet-4-20250514 via Anthropic API.
// Assembles the full system prompt with Kevin's voice profile + project context + last 10 posts.
// Parses the structured JSON response into a map of platform → draft.
@Service
public class ClaudeService {

    public Object generatePosts(String projectContext, String userInput, String[] platforms) {
        // TODO: assemble prompt, call Claude API, parse JSON response
        throw new UnsupportedOperationException("Sprint 2");
    }

    public Object generateRedditCommentSuggestion(String projectContext, String redditPostContent) {
        // TODO: generate comment suggestion for a Reddit post
        throw new UnsupportedOperationException("Sprint 2");
    }
}
