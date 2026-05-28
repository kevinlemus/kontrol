package com.kontrol.repository;

import com.kontrol.model.AnalyticsInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AnalyticsInsightRepository extends JpaRepository<AnalyticsInsight, UUID> {

    @Query("SELECT a FROM AnalyticsInsight a WHERE a.projectId = :projectId AND a.createdAt > :since ORDER BY a.createdAt DESC")
    Optional<AnalyticsInsight> findRecentByProjectId(
        @Param("projectId") UUID projectId,
        @Param("since") OffsetDateTime since);
}
