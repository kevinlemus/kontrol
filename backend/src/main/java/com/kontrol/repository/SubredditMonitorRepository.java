package com.kontrol.repository;

import com.kontrol.model.SubredditMonitor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubredditMonitorRepository extends JpaRepository<SubredditMonitor, UUID> {
    List<SubredditMonitor> findByActiveTrue();
    List<SubredditMonitor> findByProjectId(UUID projectId);
}
