package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrategySuggestionDto {
    private List<SuggestionItem> suggestions;

    // Content calendar intelligence fields
    private Map<String, Long> contentMixCounts;
    private Map<String, Double> contentMixPercents;
    private List<String> recentTypes;
    private long totalPostsLast30Days;
    private String mixWarning;
    private boolean mixBalanced;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestionItem {
        private String title;
        private String reason;
        private String platform;
        private String contentType;
        private String urgency;
        private String estimatedEngagement;
        private String suggestedPrompt;
    }
}
