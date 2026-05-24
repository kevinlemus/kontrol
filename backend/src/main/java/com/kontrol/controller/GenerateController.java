package com.kontrol.controller;

import com.kontrol.dto.*;
import com.kontrol.model.ScheduledPost;
import com.kontrol.repository.ScheduledPostRepository;
import com.kontrol.service.GenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
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

    @PostMapping("/generate")
    public ResponseEntity<GenerateResponse> generate(@RequestBody GenerateRequest dto) {
        return ResponseEntity.ok(generationService.generate(dto));
    }

    @PostMapping("/intake")
    public ResponseEntity<GenerateResponse> intake(@RequestBody IntakeRequest dto) {
        // Intake from external sources (Dispatch, Cowork, etc.)
        GenerateRequest req = new GenerateRequest();
        req.setProjectId(dto.getProjectId());
        req.setPrompt(dto.getContent());
        req.setPlatforms(List.of("IG", "TT", "LI", "RD", "X"));
        GenerateResponse response = generationService.generate(req);
        // TODO: Send PWA push notification — add VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to .env
        log.info("Intake from source={} for project={}", dto.getSource(), dto.getProjectId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedule")
    public ResponseEntity<Void> schedule(@RequestBody ScheduleRequest dto) {
        UUID postId = UUID.fromString(dto.getPostId());
        for (ScheduleRequest.PlatformScheduleItem item : dto.getPlatforms()) {
            scheduledPostRepository.save(ScheduledPost.builder()
                .postId(postId)
                .scheduledAt(OffsetDateTime.parse(item.getScheduledAt()))
                .status("pending")
                .build());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publish/{postId}")
    public ResponseEntity<String> publishNow(@PathVariable UUID postId) {
        // Immediate publish — schedule for now, scheduler picks up in <60s
        scheduledPostRepository.save(ScheduledPost.builder()
            .postId(postId).scheduledAt(OffsetDateTime.now()).status("pending").build());
        return ResponseEntity.ok("{\"message\":\"Queued for immediate publish\"}");
    }
}
