package com.kontrol.repository;

import com.kontrol.model.PlatformConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlatformConfigRepository extends JpaRepository<PlatformConfig, UUID> {
    List<PlatformConfig> findByProjectId(UUID projectId);
    Optional<PlatformConfig> findByProjectIdAndPlatform(UUID projectId, String platform);
}
