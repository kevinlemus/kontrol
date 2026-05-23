package com.kontrol.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// BACKEND-AGENT: Scheduled job that runs every 4 hours.
// For each active subreddit_monitor row:
//   1. Fetch recent posts from Reddit API
//   2. Send to ClaudeService.generateRedditCommentSuggestion()
//   3. Save suggestions to reddit_suggestions table
//   4. Send PWA push notification if new suggestions added
@Service
public class RedditMonitorJob {

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000) // every 4 hours
    public void runMonitor() {
        // TODO: implement Reddit monitor job
    }
}
