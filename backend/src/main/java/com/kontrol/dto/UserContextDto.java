package com.kontrol.dto;

import lombok.*;

/**
 * Lightweight user context passed into Claude generation.
 * Contains only what Claude needs — not the password hash.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserContextDto {
    private String name;         // "Kevin" — used in system prompt
    private String voiceProfile; // injected verbatim into system prompt
}
