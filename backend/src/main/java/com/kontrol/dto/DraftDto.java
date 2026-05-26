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
    private String selectedSubreddit;   // subreddit name without r/ prefix — selected by Claude from monitored list
    private String subredditReasoning;  // one-sentence explanation of why Claude chose this subreddit
    private String postPlatformId;      // UUID string — set by GenerationService after saving PostPlatform row
    private String hook;                // 5-8 word punchy video overlay text (transient — not persisted to DB)
}
