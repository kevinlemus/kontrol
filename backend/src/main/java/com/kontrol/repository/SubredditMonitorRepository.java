package com.kontrol.repository;

import com.kontrol.model.SubredditMonitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface SubredditMonitorRepository extends JpaRepository<SubredditMonitor, UUID> {
    List<SubredditMonitor> findByActiveTrue();
    List<SubredditMonitor> findByProjectId(UUID projectId);

    // Find active monitors for a project that are NOT in cooldown (lastPostedAt is null or > 48h ago)
    @Query("SELECT m FROM SubredditMonitor m WHERE m.projectId = :projectId AND m.active = true AND (m.lastPostedAt IS NULL OR m.lastPostedAt < :cutoff)")
    List<SubredditMonitor> findEligibleByProjectId(@Param("projectId") UUID projectId, @Param("cutoff") OffsetDateTime cutoff);

    // All active monitors for a project regardless of cooldown
    List<SubredditMonitor> findByProjectIdAndActiveTrue(UUID projectId);
}
