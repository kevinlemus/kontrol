package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "global_platform_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalPlatformAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "platform", unique = true, nullable = false)
    private String platform;

    @Column(name = "access_token")
    private String accessToken;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "account_id")
    private String accountId;

    @Column(name = "extra_config", columnDefinition = "jsonb")
    private String extraConfig;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
