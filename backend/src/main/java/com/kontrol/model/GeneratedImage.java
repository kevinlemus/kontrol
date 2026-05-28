package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "generated_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "image_prompt", nullable = false, columnDefinition = "TEXT")
    private String imagePrompt;

    @Column(name = "seed", nullable = false)
    private Long seed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
