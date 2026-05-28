package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateImageResponse {
    private String imageId;
    private String imageUrl;
    private String imagePrompt;
    private Long seed;
}
