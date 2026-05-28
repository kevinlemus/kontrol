package com.kontrol.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class CreateAdCampaignRequest {
    private String projectId;
    private String postPlatformId;
    private String platform;
    private BigDecimal dailyBudget;
    private Integer durationDays;
    private Map<String, Object> targeting;
}
