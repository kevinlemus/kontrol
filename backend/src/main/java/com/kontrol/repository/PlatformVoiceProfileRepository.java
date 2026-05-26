package com.kontrol.repository;

import com.kontrol.model.PlatformVoiceProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlatformVoiceProfileRepository extends JpaRepository<PlatformVoiceProfile, UUID> {
    Optional<PlatformVoiceProfile> findByProjectIdAndPlatform(UUID projectId, String platform);
    List<PlatformVoiceProfile> findByProjectId(UUID projectId);
}
