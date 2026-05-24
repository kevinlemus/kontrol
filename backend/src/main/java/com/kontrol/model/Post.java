package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "input_type", nullable = false)
    private String inputType;

    @Column(name = "input_content")
    private String inputContent;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "status")
    private String status;

    @Column(name = "scheduled_at")
    private OffsetDateTime scheduledAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "source")
    private String source;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
