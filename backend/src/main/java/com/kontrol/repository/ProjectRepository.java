package com.kontrol.repository;

import com.kontrol.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByActiveTrue();

    /** Legacy — returns all projects regardless of owner. */
    List<Project> findAllByOrderByCreatedAtDesc();

    /**
     * Projects owned by this user, plus legacy rows with null user_id (backward compat).
     * Once all rows have a user_id this degrades to a simple userId = :userId query.
     */
    @Query("SELECT p FROM Project p WHERE p.userId = :userId OR p.userId IS NULL ORDER BY p.createdAt DESC")
    List<Project> findByUserIdOrLegacy(@Param("userId") UUID userId);

    /** Owned-or-legacy lookup for the currently active project. */
    @Query("SELECT p FROM Project p WHERE (p.userId = :userId OR p.userId IS NULL) AND p.active = true ORDER BY p.createdAt DESC")
    List<Project> findActiveByUserId(@Param("userId") UUID userId);
}
