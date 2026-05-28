package com.kontrol.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateAdCampaignRequest {
    private String status;
    private BigDecimal dailyBudget;
}
