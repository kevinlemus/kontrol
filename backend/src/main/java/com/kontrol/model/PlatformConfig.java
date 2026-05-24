package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    // Raw FK for direct querying
    @Column(name = "project_id")
    private UUID projectId;

    // Lazy-loaded association for traversal when needed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    @Column(name = "platform", nullable = false)
    private String platform;

    @Column(name = "enabled")
    private boolean enabled;

    @Column(name = "use_global_account")
    private boolean useGlobalAccount;

    @Column(name = "access_token")
    private String accessToken;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "account_id")
    private String accountId;

    @Column(name = "extra_config", columnDefinition = "jsonb")
    private String extraConfig;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
