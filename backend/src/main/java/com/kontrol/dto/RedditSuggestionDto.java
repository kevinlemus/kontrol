package com.kontrol.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedditSuggestionDto {
    private String id;
    private String subreddit;
    private String redditPostTitle;
    private String redditPostUrl;
    private String suggestedComment;
    private String status;
    private String postedAt;
    private String createdAt;
    private String redditPostId;
    private String commentId;
    private Boolean isReply;
    private String replyToUsername;
    private String replyToComment;
}
