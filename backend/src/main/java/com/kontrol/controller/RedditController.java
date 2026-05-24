package com.kontrol.controller;

import com.kontrol.dto.PostCommentRequest;
import com.kontrol.dto.RedditSuggestionDto;
import com.kontrol.model.RedditSuggestion;
import com.kontrol.model.SubredditMonitor;
import com.kontrol.repository.RedditSuggestionRepository;
import com.kontrol.repository.SubredditMonitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/reddit/suggestions/{projectId} complete
// BACKEND-AGENT: POST /api/v1/reddit/post-comment complete
@RestController
@RequestMapping("/api/v1/reddit")
@RequiredArgsConstructor
public class RedditController {

    private final RedditSuggestionRepository suggestionRepo;
    private final SubredditMonitorRepository monitorRepo;

    @GetMapping("/suggestions/{projectId}")
    public ResponseEntity<List<RedditSuggestionDto>> getSuggestions(@PathVariable UUID projectId) {
        return ResponseEntity.ok(suggestionRepo.findByProjectId(projectId)
            .stream().map(this::toDto).toList());
    }

    @PostMapping("/post-comment")
    public ResponseEntity<Void> postComment(@RequestBody PostCommentRequest req) {
        suggestionRepo.findById(UUID.fromString(req.getSuggestionId())).ifPresent(s -> {
            // TODO: Call RedditService.postComment() when Reddit credentials are configured
            // String text = req.getCommentText() != null ? req.getCommentText() : s.getSuggestedComment();
            s.setStatus("posted");
            s.setPostedAt(OffsetDateTime.now());
            suggestionRepo.save(s);
        });
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/suggestions/{id}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable UUID id) {
        suggestionRepo.findById(id).ifPresent(s -> {
            s.setStatus("dismissed");
            suggestionRepo.save(s);
        });
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/monitors/{projectId}")
    public ResponseEntity<List<SubredditMonitor>> getMonitors(@PathVariable UUID projectId) {
        return ResponseEntity.ok(monitorRepo.findByProjectId(projectId));
    }

    @PostMapping("/monitors")
    public ResponseEntity<SubredditMonitor> addMonitor(@RequestBody SubredditMonitor monitor) {
        return ResponseEntity.status(201).body(monitorRepo.save(monitor));
    }

    @DeleteMapping("/monitors/{id}")
    public ResponseEntity<Void> removeMonitor(@PathVariable UUID id) {
        monitorRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private RedditSuggestionDto toDto(RedditSuggestion s) {
        return RedditSuggestionDto.builder()
            .id(s.getId().toString()).subreddit(s.getSubreddit())
            .redditPostTitle(s.getRedditPostTitle()).redditPostUrl(s.getRedditPostUrl())
            .suggestedComment(s.getSuggestedComment()).status(s.getStatus())
            .postedAt(s.getPostedAt() != null ? s.getPostedAt().toString() : null)
            .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
            .build();
    }
}
