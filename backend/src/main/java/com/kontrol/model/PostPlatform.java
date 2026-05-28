package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "post_platforms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostPlatform {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "platform", nullable = false)
    private String platform;

    @Column(name = "post_type")
    private String postType;

    @Column(name = "content")
    private String content;

    @Column(name = "extra_data", columnDefinition = "jsonb")
    private String extraData;

    @Column(name = "status")
    private String status;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "platform_post_id")
    private String platformPostId;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "was_overridden")
    private Boolean wasOverridden = false;

    @Column(name = "original_content", columnDefinition = "TEXT")
    private String originalContent;

    @Column(name = "likes")
    private Integer likes = 0;

    @Column(name = "comments")
    private Integer comments = 0;

    @Column(name = "shares")
    private Integer shares = 0;

    @Column(name = "performance_score")
    private BigDecimal performanceScore = BigDecimal.ZERO;

    @Column(name = "posted_hour")
    private Integer postedHour;

    @Column(name = "posted_day_of_week")
    private Integer postedDayOfWeek;

    @Column(name = "performance_checked_at")
    private OffsetDateTime performanceCheckedAt;

    @Column(name = "content_type")
    private String contentType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
