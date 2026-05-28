package com.kontrol.repository;

import com.kontrol.model.AdCampaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AdCampaignRepository extends JpaRepository<AdCampaign, UUID> {
    List<AdCampaign> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
