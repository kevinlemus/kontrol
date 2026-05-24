package com.kontrol.repository;

import com.kontrol.model.RedditSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RedditSuggestionRepository extends JpaRepository<RedditSuggestion, UUID> {
    List<RedditSuggestion> findByProjectId(UUID projectId);
    List<RedditSuggestion> findByProjectIdAndStatus(UUID projectId, String status);
    boolean existsByRedditPostId(String redditPostId);
}
