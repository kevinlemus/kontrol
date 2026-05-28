package com.kontrol.repository;

import com.kontrol.model.StrategyCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface StrategyCacheRepository extends JpaRepository<StrategyCache, UUID> {

    @Query("SELECT s FROM StrategyCache s WHERE s.projectId = :projectId AND s.createdAt > :since ORDER BY s.createdAt DESC")
    Optional<StrategyCache> findRecentByProjectId(
        @Param("projectId") UUID projectId,
        @Param("since") OffsetDateTime since);
}
