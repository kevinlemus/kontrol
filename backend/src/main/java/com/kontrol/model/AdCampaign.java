package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ad_campaigns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "post_platform_id")
    private UUID postPlatformId;

    @Column(name = "platform")
    private String platform;

    @Column(name = "daily_budget", precision = 10, scale = 2)
    private BigDecimal dailyBudget;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "targeting", columnDefinition = "jsonb")
    private String targeting;

    @Column(name = "status")
    private String status;

    @Column(name = "platform_campaign_id")
    private String platformCampaignId;

    @Column(name = "impressions")
    private Long impressions;

    @Column(name = "clicks")
    private Long clicks;

    @Column(name = "spend", precision = 10, scale = 2)
    private BigDecimal spend;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
