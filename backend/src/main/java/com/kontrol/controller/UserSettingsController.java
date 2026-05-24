package com.kontrol.controller;

import com.kontrol.dto.UserSettingsDto;
import com.kontrol.service.UserSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Legacy settings endpoint — kept for backward compatibility.
 * New auth-aware endpoints live at /api/v1/auth/*.
 */
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/user")
    public ResponseEntity<UserSettingsDto> getUserSettings() {
        return ResponseEntity.ok(userSettingsService.toDto(userSettingsService.getUser()));
    }

    @PutMapping("/user")
    public ResponseEntity<UserSettingsDto> updateUserSettings(@RequestBody UserSettingsDto req) {
        UserSettingsDto updated = userSettingsService.updateSettings(req.getName(), req.getEmail(), req.getVoiceProfile());
        return ResponseEntity.ok(updated);
    }
}
