package com.kontrol.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank
    private String name;
    private String whatItIs;
    private String whoItsFor;
    private String vibe;
    private String currentStatus;
}
