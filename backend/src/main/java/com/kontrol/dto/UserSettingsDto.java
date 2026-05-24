package com.kontrol.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserSettingsDto {
    private String id;
    private String userName;
}
