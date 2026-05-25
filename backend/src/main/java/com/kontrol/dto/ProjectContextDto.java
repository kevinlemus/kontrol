package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * All project fields passed into Claude generation, including competitive intelligence.
 * platformCompetitorNotes is transient — never persisted, computed at generation time.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectContextDto {
    private String name;
    private String whatItIs;
    private String whoItsFor;
    private String vibe;
    private String currentStatus;
    private String industry;
    private String competitor1;
    private String competitor2;
    private String competitor3;
    private String projectContextText;
    private String contextSource;
    /** Per-platform competitive notes. Key = platform code (e.g. "IG"), value = notes string. Transient — never persisted. */
    private Map<String, String> platformCompetitorNotes;
}
