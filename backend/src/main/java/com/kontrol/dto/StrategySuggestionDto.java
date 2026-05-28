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
public class StrategySuggestionDto {
    private List<SuggestionItem> suggestions;

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
