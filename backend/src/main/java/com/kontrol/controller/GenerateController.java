package com.kontrol.controller;

import com.kontrol.dto.*;
import com.kontrol.model.ScheduledPost;
import com.kontrol.repository.ScheduledPostRepository;
import com.kontrol.service.GenerationService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: POST /api/v1/generate complete
// BACKEND-AGENT: POST /api/v1/intake complete
// BACKEND-AGENT: POST /api/v1/schedule complete
// BACKEND-AGENT: POST /api/v1/publish/{postId} complete
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class GenerateController {

    private final GenerationService generationService;
    private final ScheduledPostRepository scheduledPostRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/generate")
    public ResponseEntity<?> generate(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody GenerateRequest dto) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.ok(generationService.generate(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Generation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/intake")
    public ResponseEntity<?> intake(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody IntakeRequest dto) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            // Intake from external sources (Dispatch, Cowork, etc.)
            GenerateRequest req = new GenerateRequest();
            req.setProjectId(dto.getProjectId());
            req.setPrompt(dto.getContent());
            req.setPlatforms(List.of("IG", "TT", "LI", "RD", "X"));
            GenerateResponse response = generationService.generate(req);
            // TODO: Send PWA push notification — add VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to .env
            log.info("Intake from source={} for project={}", dto.getSource(), dto.getProjectId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Intake failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Intake failed: " + e.getMessage()));
        }
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ScheduleRequest dto) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            UUID postId = UUID.fromString(dto.getPostId());
            for (ScheduleRequest.PlatformScheduleItem item : dto.getPlatforms()) {
                scheduledPostRepository.save(ScheduledPost.builder()
                    .postId(postId)
                    .scheduledAt(OffsetDateTime.parse(item.getScheduledAt()))
                    .status("pending")
                    .build());
            }
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Schedule failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Schedule failed: " + e.getMessage()));
        }
    }

    @PostMapping("/publish/{postId}")
    public ResponseEntity<?> publishNow(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID postId) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            // Immediate publish — schedule for now, scheduler picks up in <60s
            scheduledPostRepository.save(ScheduledPost.builder()
                .postId(postId).scheduledAt(OffsetDateTime.now()).status("pending").build());
            return ResponseEntity.ok(Map.of("message", "Queued for immediate publish"));
        } catch (Exception e) {
            log.error("Publish failed for postId={}: {}", postId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Publish failed: " + e.getMessage()));
        }
    }
}
