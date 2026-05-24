package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
