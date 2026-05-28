package com.kontrol.dto;

import lombok.Data;

@Data
public class RegenerateImageRequest {
    private String imageId;
    private boolean variation;
}
