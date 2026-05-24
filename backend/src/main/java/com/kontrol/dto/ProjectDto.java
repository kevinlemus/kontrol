package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {
    private String id;
    private String name;
    private String whatItIs;
    private String whoItsFor;
    private String vibe;
    private String currentStatus;
    private boolean active;
}
