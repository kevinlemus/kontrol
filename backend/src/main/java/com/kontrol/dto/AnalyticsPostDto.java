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
public class AnalyticsPostDto {
    private String platformId;
    private String platform;
    private String content;
    private String status;
    private OffsetDateTime createdAt;
    private String platformPostId;
}
