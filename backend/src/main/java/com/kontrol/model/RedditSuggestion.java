package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reddit_suggestions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedditSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "subreddit", nullable = false)
    private String subreddit;

    @Column(name = "reddit_post_id", nullable = false)
    private String redditPostId;

    @Column(name = "reddit_post_title")
    private String redditPostTitle;

    @Column(name = "reddit_post_url")
    private String redditPostUrl;

    @Column(name = "suggested_comment")
    private String suggestedComment;

    @Column(name = "status")
    private String status;

    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
