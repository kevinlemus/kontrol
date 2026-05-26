package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "historical_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalPost {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String platform;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "post_type")
    private String postType;

    @Column(nullable = false)
    @Builder.Default
    private Integer likes = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer comments = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer shares = 0;

    @Column(name = "performance_score", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal performanceScore = BigDecimal.ZERO;

    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @Column(name = "imported_at")
    @Builder.Default
    private OffsetDateTime importedAt = OffsetDateTime.now();
}
