package com.kontrol.controller;

import com.kontrol.dto.CompetitorAnalyzeRequest;
import com.kontrol.service.CompetitorService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: POST /api/v1/competitors/analyze complete
// BACKEND-AGENT: GET /api/v1/competitors/insights complete
// BACKEND-AGENT: GET /api/v1/competitors/suggest complete
@RestController
@RequestMapping("/api/v1/competitors")
@RequiredArgsConstructor
@Slf4j
public class CompetitorController {

    private final CompetitorService competitorService;
    private final JwtUtil jwtUtil;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CompetitorAnalyzeRequest request) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            UUID projectId = UUID.fromString(request.getProjectId());
            return ResponseEntity.ok(competitorService.analyze(projectId, request.getCompetitorName(), request.getPlatform()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Competitor analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(
            @RequestParam UUID projectId,
            @RequestParam String competitorName,
            @RequestParam String platform) {
        try {
            var result = competitorService.getInsights(projectId, competitorName, platform);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Get competitor insights failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/suggest")
    public ResponseEntity<?> suggest(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(Map.of("suggestions", competitorService.suggestCompetitors(projectId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Competitor suggest failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
