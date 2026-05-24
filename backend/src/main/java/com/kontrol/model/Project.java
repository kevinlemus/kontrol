package com.kontrol.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "what_it_is")
    private String whatItIs;

    @Column(name = "who_its_for")
    private String whoItsFor;

    @Column(name = "vibe")
    private String vibe;

    @Column(name = "current_status")
    private String currentStatus;

    @Column(name = "active")
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
