package com.kontrol.repository;

import com.kontrol.model.HistoricalPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface HistoricalPostRepository extends JpaRepository<HistoricalPost, UUID> {
    List<HistoricalPost> findByProjectIdAndPlatformOrderByPostedAtDesc(UUID projectId, String platform);
    long countByProjectIdAndPlatform(UUID projectId, String platform);
    void deleteByProjectIdAndPlatform(UUID projectId, String platform);
}
