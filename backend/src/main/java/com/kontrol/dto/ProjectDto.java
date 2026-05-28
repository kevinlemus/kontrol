package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {
    private String id;
    private String name;
    private String whatItIs;
    private String whoItsFor;
    private String currentStatus;
    private boolean active;
    private String competitor1;
    private String competitor2;
    private String competitor3;
    private String industry;
    private String projectContextText;
    private String contextSource;
    private String phone;
    private String bookingUrl;
    private String serviceArea;
    private String adAccountId;
}
