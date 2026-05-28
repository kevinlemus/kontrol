package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HookInsightsDto {
    private List<HookInsightItem> insights;
    private String claudeAnalysis;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HookInsightItem {
        private String hookStyle;
        private double avgScore;
        private String recommendation;
    }
}
