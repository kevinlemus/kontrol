package com.kontrol.repository;

import com.kontrol.model.ScheduledPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, UUID> {
    List<ScheduledPost> findByStatusAndScheduledAtLessThanEqual(String status, OffsetDateTime scheduledAt);
    List<ScheduledPost> findByPostId(UUID postId);
}
