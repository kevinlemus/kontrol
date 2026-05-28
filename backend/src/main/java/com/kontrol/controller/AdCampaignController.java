package com.kontrol.controller;

import com.kontrol.dto.CreateAdCampaignRequest;
import com.kontrol.dto.UpdateAdCampaignRequest;
import com.kontrol.service.AdCampaignService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: POST /api/v1/ads/create complete
// BACKEND-AGENT: GET /api/v1/ads complete
// BACKEND-AGENT: PUT /api/v1/ads/{id} complete
// BACKEND-AGENT: GET /api/v1/ads/{id}/performance complete
@RestController
@RequestMapping("/api/v1/ads")
@RequiredArgsConstructor
@Slf4j
public class AdCampaignController {

    private final AdCampaignService adCampaignService;
    private final JwtUtil jwtUtil;

    @PostMapping("/create")
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CreateAdCampaignRequest request) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.status(201).body(adCampaignService.create(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Ad campaign creation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(adCampaignService.getByProject(projectId));
        } catch (Exception e) {
            log.error("Get ad campaigns failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id,
            @RequestBody UpdateAdCampaignRequest request) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.ok(adCampaignService.update(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Ad campaign update failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/performance")
    public ResponseEntity<?> getPerformance(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(adCampaignService.getPerformance(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Ad campaign performance failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
