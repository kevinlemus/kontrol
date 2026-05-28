package com.kontrol.controller;

import com.kontrol.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/analytics/overview complete
// BACKEND-AGENT: GET /api/v1/analytics/posts complete
// BACKEND-AGENT: GET /api/v1/analytics/insights complete
// BACKEND-AGENT: GET /api/v1/analytics/platform complete
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(analyticsService.getOverview(projectId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Analytics overview failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(
            @RequestParam UUID projectId,
            @RequestParam(required = false) String platform,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            return ResponseEntity.ok(analyticsService.getPosts(projectId, platform, limit));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Analytics posts failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(analyticsService.getInsights(projectId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Analytics insights failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/platform")
    public ResponseEntity<?> getPlatformStats(
            @RequestParam UUID projectId,
            @RequestParam String platform) {
        try {
            return ResponseEntity.ok(analyticsService.getPlatformStats(projectId, platform));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Analytics platform stats failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
