package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenerateResponse {
    private String postId;
    private Map<String, DraftDto> drafts;
}
