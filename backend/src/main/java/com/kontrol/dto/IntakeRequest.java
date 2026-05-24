package com.kontrol.dto;

import lombok.Data;

@Data
public class IntakeRequest {
    private String projectId;
    private String content;
    private String source; // "dispatch", "cowork", "manual"
}
