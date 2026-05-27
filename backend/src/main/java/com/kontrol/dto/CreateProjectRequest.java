package com.kontrol.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank
    private String name;
    private String whatItIs;
    private String whoItsFor;
    private String currentStatus;
    private String competitor1;
    private String competitor2;
    private String competitor3;
    private String industry;
    private String projectContextText;
    private String contextSource;
    private String phone;
    private String bookingUrl;
    private String serviceArea;
}
