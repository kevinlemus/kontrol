package com.kontrol.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PerformanceInsightDto {
    private String platform;
    private int totalPosts;
    private boolean hasEnoughData;           // totalPosts >= 10
    private Double overrideAvgScore;         // avg score when wasOverridden=true
    private Double claudeAvgScore;           // avg score when wasOverridden=false
    private Double overrideImprovementPct;   // (overrideAvg - claudeAvg) / claudeAvg * 100
    private Integer bestHour;                // 0-23
    private Integer bestDayOfWeek;           // 1-7 (Mon=1)
    private String bestHourLabel;            // "8pm"
    private String bestDayLabel;             // "Tuesday"
    private String confidenceLabel;          // "Learning..." or "Based on your data"
    private String insightSummary;           // human-readable for UI and system prompt
}
