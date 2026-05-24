package com.kontrol.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishResult {
    private String platformId;
    private boolean success;
    private String platformPostId;
    private String errorMessage;
}
