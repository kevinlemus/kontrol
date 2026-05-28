package com.kontrol.controller;

import com.kontrol.service.HookPerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/hooks/insights complete
@RestController
@RequestMapping("/api/v1/hooks")
@RequiredArgsConstructor
@Slf4j
public class HookController {

    private final HookPerformanceService hookPerformanceService;

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(
            @RequestParam UUID projectId,
            @RequestParam(required = false, defaultValue = "IG") String platform) {
        try {
            return ResponseEntity.ok(hookPerformanceService.getHookInsights(projectId, platform));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Hook insights failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
