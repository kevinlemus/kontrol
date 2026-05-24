package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "scheduled_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(name = "executed_at")
    private OffsetDateTime executedAt;

    @Column(name = "status")
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
