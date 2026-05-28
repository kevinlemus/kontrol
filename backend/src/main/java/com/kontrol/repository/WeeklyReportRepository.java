package com.kontrol.repository;

import com.kontrol.model.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, UUID> {

    List<WeeklyReport> findByProjectIdOrderByWeekOfDesc(UUID projectId);

    @Query("SELECT w FROM WeeklyReport w WHERE w.projectId = :projectId AND w.weekOf = :weekOf AND w.createdAt > :since ORDER BY w.createdAt DESC")
    Optional<WeeklyReport> findByProjectIdAndWeekOfAndRecent(
        @Param("projectId") UUID projectId,
        @Param("weekOf") LocalDate weekOf,
        @Param("since") OffsetDateTime since);
}
