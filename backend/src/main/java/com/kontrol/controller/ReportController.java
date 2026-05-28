package com.kontrol.controller;

import com.kontrol.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/reports/weekly complete
// BACKEND-AGENT: GET /api/v1/reports complete
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeekly(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(weeklyReportService.getWeeklyReport(projectId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Weekly report failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllReports(@RequestParam UUID projectId) {
        try {
            return ResponseEntity.ok(weeklyReportService.getAllReports(projectId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Get reports failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
