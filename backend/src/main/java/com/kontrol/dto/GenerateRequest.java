package com.kontrol.dto;

import lombok.Data;

import java.util.List;

@Data
public class GenerateRequest {
    private String projectId;
    private String prompt;
    private List<String> platforms;
    private String postType; // "post", "story", "reel", etc.
}
