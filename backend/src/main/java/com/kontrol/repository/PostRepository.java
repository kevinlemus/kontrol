package com.kontrol.repository;

import com.kontrol.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findTop10ByProjectIdOrderByCreatedAtDesc(UUID projectId);
    List<Post> findByProjectId(UUID projectId);
}
