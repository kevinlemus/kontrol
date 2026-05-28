package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReportDto {
    private String reportId;
    private LocalDate weekOf;
    private int postsPublished;
    private int postsPlanned;
    private long totalEngagement;
    private double vsLastWeek;
    private TopPost topPost;
    private String claudeSummary;
    private List<String> recommendations;
    private Map<String, Object> platformBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPost {
        private String content;
        private String platform;
        private double score;
    }
}
