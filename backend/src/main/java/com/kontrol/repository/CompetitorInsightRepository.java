package com.kontrol.repository;

import com.kontrol.model.CompetitorInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompetitorInsightRepository extends JpaRepository<CompetitorInsight, UUID> {

    Optional<CompetitorInsight> findByProjectIdAndCompetitorNameAndPlatform(
        UUID projectId, String competitorName, String platform);
}
