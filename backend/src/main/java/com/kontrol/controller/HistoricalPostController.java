package com.kontrol.controller;

import com.kontrol.service.HistoricalPostService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/historical")
@RequiredArgsConstructor
public class HistoricalPostController {

    private final HistoricalPostService historicalPostService;
    private final JwtUtil jwtUtil;

    // BACKEND-AGENT: POST /api/v1/historical/import/{platform} complete
    @PostMapping("/import/{platform}")
    public ResponseEntity<?> importPosts(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String platform,
            @RequestParam(value = "project_id", required = false) String projectId) {
        if (!jwtUtil.isValid(jwtUtil.extractBearer(auth))) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            UUID pid = projectId != null ? UUID.fromString(projectId) : null;
            HistoricalPostService.ImportResult result = historicalPostService.importPosts(pid, platform);
            return ResponseEntity.ok(Map.of(
                "imported", result.imported(),
                "message", result.message(),
                "success", result.success()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // BACKEND-AGENT: GET /api/v1/historical/status complete
    @GetMapping("/status")
    public ResponseEntity<?> getStatus(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "project_id", required = false) String projectId) {
        if (!jwtUtil.isValid(jwtUtil.extractBearer(auth))) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            UUID pid = projectId != null ? UUID.fromString(projectId) : null;
            if (pid == null) return ResponseEntity.ok(List.of());
            return ResponseEntity.ok(historicalPostService.getAllImportStatus(pid));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
