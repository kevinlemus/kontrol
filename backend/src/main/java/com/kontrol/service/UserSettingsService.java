package com.kontrol.service;

import com.kontrol.dto.UserContextDto;
import com.kontrol.dto.UserSettingsDto;
import com.kontrol.model.UserSettings;
import com.kontrol.repository.UserSettingsRepository;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final JwtUtil jwtUtil;

    private static final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    /** Get the single user row. Returns a default if table is empty. */
    public UserSettings getUser() {
        return userSettingsRepository.findTopByOrderByCreatedAtAsc()
            .orElse(UserSettings.builder().name("User").passwordHash("").build());
    }

    /** Lightweight context for Claude — never includes password hash. */
    public UserContextDto getUserContext() {
        UserSettings u = getUser();
        return UserContextDto.builder()
            .name(u.getName())
            .voiceProfile(u.getVoiceProfile())
            .build();
    }

    public UserSettingsDto toDto(UserSettings u) {
        return UserSettingsDto.builder()
            .id(u.getId() != null ? u.getId().toString() : null)
            .name(u.getName())
            .email(u.getEmail())
            .voiceProfile(u.getVoiceProfile())
            .build();
    }

    /**
     * Validate password against stored BCrypt hash.
     * Returns a JWT token on success, null on failure.
     */
    public String login(String password) {
        UserSettings u = getUser();
        if (u.getId() == null) return null; // no user in DB
        if (!bcrypt.matches(password, u.getPasswordHash())) return null;
        return jwtUtil.generateToken(u.getId().toString());
    }

    /** Update name, email, voice profile. Pass null to leave unchanged. */
    public UserSettingsDto updateSettings(String name, String email, String voiceProfile) {
        UserSettings u = getUser();
        if (name != null && !name.isBlank()) u.setName(name);
        if (email != null) u.setEmail(email);
        if (voiceProfile != null) u.setVoiceProfile(voiceProfile);
        u.setUpdatedAt(OffsetDateTime.now());
        return toDto(userSettingsRepository.save(u));
    }

    /** Change password — validates current password first. Returns false if wrong. */
    public boolean changePassword(String currentPassword, String newPassword) {
        UserSettings u = getUser();
        if (!bcrypt.matches(currentPassword, u.getPasswordHash())) return false;
        u.setPasswordHash(bcrypt.encode(newPassword));
        u.setUpdatedAt(OffsetDateTime.now());
        userSettingsRepository.save(u);
        return true;
    }

    /** One-time setup: only works when password_hash = 'SETUP_REQUIRED'. */
    public boolean setupPassword(String newPassword) {
        UserSettings u = getUser();
        if (!"SETUP_REQUIRED".equals(u.getPasswordHash())) return false;
        u.setPasswordHash(bcrypt.encode(newPassword));
        u.setUpdatedAt(OffsetDateTime.now());
        userSettingsRepository.save(u);
        log.info("Password set via setup endpoint. This endpoint is now disabled.");
        return true;
    }

    public boolean validateToken(String token) {
        return jwtUtil.isValid(token);
    }
}
