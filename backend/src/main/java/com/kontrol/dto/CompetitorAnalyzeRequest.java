package com.kontrol.dto;

import lombok.Data;

@Data
public class CompetitorAnalyzeRequest {
    private String projectId;
    private String competitorName;
    private String platform;
}
