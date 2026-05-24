package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "subreddit_monitors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubredditMonitor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "subreddit", nullable = false)
    private String subreddit;

    @Column(name = "active")
    private boolean active;

    @Column(name = "last_checked_at")
    private OffsetDateTime lastCheckedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
