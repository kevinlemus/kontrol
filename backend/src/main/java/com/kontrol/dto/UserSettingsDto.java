package com.kontrol.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserSettingsDto {
    private String id;
    private String name;
    private String email;
    private String voiceProfile;
    // password never returned to frontend
}
