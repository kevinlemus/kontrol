package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "competitor_insights")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitorInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "competitor_name", nullable = false)
    private String competitorName;

    @Column(name = "platform", nullable = false)
    private String platform;

    @Column(name = "post_frequency")
    private String postFrequency;

    @Column(name = "top_content_types", columnDefinition = "TEXT")
    private String topContentTypes;

    @Column(name = "engagement_patterns", columnDefinition = "TEXT")
    private String engagementPatterns;

    @Column(name = "claude_analysis", columnDefinition = "TEXT")
    private String claudeAnalysis;

    @Column(name = "differentiation_tips", columnDefinition = "TEXT")
    private String differentiationTips;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_analyzed_at")
    private OffsetDateTime lastAnalyzedAt;
}
