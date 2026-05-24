package com.kontrol.repository;

import com.kontrol.model.PostPlatform;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostPlatformRepository extends JpaRepository<PostPlatform, UUID> {
    List<PostPlatform> findByPostId(UUID postId);
    List<PostPlatform> findByPostIdAndStatus(UUID postId, String status);
}
