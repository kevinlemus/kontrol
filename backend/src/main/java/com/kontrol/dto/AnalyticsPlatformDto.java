package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsPlatformDto {
    private String platform;
    private int postCount;
    private Map<String, Long> statusBreakdown;
    private OffsetDateTime mostRecentPost;
}
