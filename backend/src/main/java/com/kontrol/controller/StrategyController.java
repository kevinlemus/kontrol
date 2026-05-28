package com.kontrol.controller;

import com.kontrol.service.StrategyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/strategy/suggestions complete
// BACKEND-AGENT: GET /api/v1/strategy/weekly-plan complete
@RestController
@RequestMapping("/api/v1/strategy")
@RequiredArgsConstructor
@Slf4j
public class StrategyController {

    private final StrategyService strategyService;

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(strategyService.getSuggestions(projectId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Strategy suggestions failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/weekly-plan")
    public ResponseEntity<?> weeklyPlan(@RequestParam String projectId) {
        try {
            return ResponseEntity.ok(strategyService.generateWeeklyPlan(UUID.fromString(projectId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Weekly plan generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
