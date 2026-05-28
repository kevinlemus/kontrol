package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDto {
    private int totalPosts;
    private double avgEngagementRate;
    private String bestPlatform;
    private String bestPostType;
    private String bestDayOfWeek;
    private String bestHour;
    private long totalReach;
    private double weekOverWeek;
    private boolean hasEnoughData;
}
