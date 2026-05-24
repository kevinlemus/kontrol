package com.kontrol.controller;

import com.kontrol.dto.PerformanceInsightDto;
import com.kontrol.dto.SmartScheduleTimingDto;
import com.kontrol.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping("/insights/{projectId}/{platform}")
    public ResponseEntity<PerformanceInsightDto> getInsights(
            @PathVariable UUID projectId,
            @PathVariable String platform) {
        return ResponseEntity.ok(performanceService.getInsightsForProject(projectId, platform));
    }

    @GetMapping("/schedule-timing/{projectId}")
    public ResponseEntity<SmartScheduleTimingDto> getScheduleTiming(
            @PathVariable UUID projectId,
            @RequestParam List<String> platforms) {
        return ResponseEntity.ok(performanceService.getSmartScheduleTiming(projectId, platforms));
    }

    @GetMapping("/subreddit-scores/{projectId}")
    public ResponseEntity<Map<String, Double>> getSubredditScores(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(performanceService.getSubredditScores(projectId));
    }
}
