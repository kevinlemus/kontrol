package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "weekly_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "week_of")
    private LocalDate weekOf;

    @Column(name = "posts_published")
    private Integer postsPublished;

    @Column(name = "posts_planned")
    private Integer postsPlanned;

    @Column(name = "total_engagement")
    private Long totalEngagement;

    @Column(name = "vs_last_week")
    private Double vsLastWeek;

    @Column(name = "top_post_content", columnDefinition = "TEXT")
    private String topPostContent;

    @Column(name = "top_post_platform")
    private String topPostPlatform;

    @Column(name = "top_post_score")
    private Double topPostScore;

    @Column(name = "claude_summary", columnDefinition = "TEXT")
    private String claudeSummary;

    @Column(name = "recommendations", columnDefinition = "jsonb")
    private String recommendations;

    @Column(name = "platform_breakdown", columnDefinition = "jsonb")
    private String platformBreakdown;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
