package com.kontrol.controller;

import com.kontrol.model.Post;
import com.kontrol.model.PostPlatform;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final PostPlatformRepository postPlatformRepository;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Post>> getByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(postRepository.findTop10ByProjectIdOrderByCreatedAtDesc(projectId));
    }

    @GetMapping("/{postId}/platforms")
    public ResponseEntity<List<PostPlatform>> getPlatforms(@PathVariable UUID postId) {
        return ResponseEntity.ok(postPlatformRepository.findByPostId(postId));
    }

    @PatchMapping("/{postId}/platforms/{platform}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID postId,
                                              @PathVariable String platform,
                                              @RequestBody Map<String, String> body) {
        postPlatformRepository.findByPostId(postId).stream()
            .filter(pp -> pp.getPlatform().equals(platform))
            .findFirst().ifPresent(pp -> {
                pp.setStatus(body.get("status"));
                postPlatformRepository.save(pp);
            });
        return ResponseEntity.noContent().build();
    }
}
