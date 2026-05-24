package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DraftDto {
    private String platformId;
    private String content;
    private String title;
    private String postType;
    private String status;
    private String selectedSubreddit;   // e.g. "bedroomproducers" (without r/)
    private String subredditReasoning;  // e.g. "Best fit — discusses vocal recording"
    private String postPlatformId;      // UUID string — set by GenerationService after saving PostPlatform row
}
