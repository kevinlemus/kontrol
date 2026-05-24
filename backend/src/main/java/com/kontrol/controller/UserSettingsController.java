package com.kontrol.controller;

import com.kontrol.dto.UserSettingsDto;
import com.kontrol.model.UserSettings;
import com.kontrol.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsRepository userSettingsRepository;

    @GetMapping("/user")
    public ResponseEntity<UserSettingsDto> getUserSettings() {
        return userSettingsRepository.findTopByOrderByUpdatedAtDesc()
            .map(s -> ResponseEntity.ok(toDto(s)))
            .orElse(ResponseEntity.ok(UserSettingsDto.builder().userName("Creator").build()));
    }

    @PutMapping("/user")
    public ResponseEntity<UserSettingsDto> updateUserSettings(@RequestBody UserSettingsDto req) {
        UserSettings settings = userSettingsRepository.findTopByOrderByUpdatedAtDesc()
            .orElse(UserSettings.builder().build());
        settings.setUserName(req.getUserName() != null && !req.getUserName().isBlank()
            ? req.getUserName() : "Creator");
        settings.setUpdatedAt(OffsetDateTime.now());
        UserSettings saved = userSettingsRepository.save(settings);
        return ResponseEntity.ok(toDto(saved));
    }

    private UserSettingsDto toDto(UserSettings s) {
        return UserSettingsDto.builder()
            .id(s.getId() != null ? s.getId().toString() : null)
            .userName(s.getUserName())
            .build();
    }
}
