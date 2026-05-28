package com.kontrol.dto;

import lombok.Data;

import java.util.Map;

@Data
public class GenerateImageRequest {
    private String prompt;
    private String platform;
    private Map<String, Object> projectContext;
    private Long seed;
}
