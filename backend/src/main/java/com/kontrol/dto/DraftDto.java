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
}
