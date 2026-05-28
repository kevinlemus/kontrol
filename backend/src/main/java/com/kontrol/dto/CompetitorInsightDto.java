package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitorInsightDto {
    private String competitorName;
    private String platform;
    private String postFrequency;
    private String topContentTypes;
    private String engagementPatterns;
    private String claudeAnalysis;
    private String differentiationTips;
    private OffsetDateTime lastAnalyzedAt;
}
