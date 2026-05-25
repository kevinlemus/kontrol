package com.kontrol.repository;

import com.kontrol.model.ProjectPlatformAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectPlatformAccountRepository extends JpaRepository<ProjectPlatformAccount, UUID> {
    List<ProjectPlatformAccount> findByProjectId(UUID projectId);
    Optional<ProjectPlatformAccount> findByProjectIdAndPlatform(UUID projectId, String platform);
    void deleteByProjectIdAndPlatform(UUID projectId, String platform);
}
