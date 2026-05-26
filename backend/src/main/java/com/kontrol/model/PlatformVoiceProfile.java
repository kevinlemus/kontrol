package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_voice_profiles",
    uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "platform"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformVoiceProfile {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String platform;

    @Column(name = "voice_summary", columnDefinition = "TEXT")
    private String voiceSummary;

    @Column(name = "analyzed_post_count", nullable = false)
    @Builder.Default
    private Integer analyzedPostCount = 0;

    @Column(name = "last_analyzed_at")
    @Builder.Default
    private OffsetDateTime lastAnalyzedAt = OffsetDateTime.now();
}
