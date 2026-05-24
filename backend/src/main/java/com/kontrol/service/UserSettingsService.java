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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final JwtUtil jwtUtil;

    private static final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    public UserSettingsDto register(String name, String email, String password) {
        if (userSettingsRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        UserSettings u = UserSettings.builder()
            .name(name)
            .email(email)
            .passwordHash(bcrypt.encode(password))
            .onboardingCompleted(false)
            .build();
        return toDto(userSettingsRepository.save(u));
    }

    public String generateTokenForUser(UUID userId) {
        return jwtUtil.generateToken(userId.toString());
    }

    public Optional<UserSettings> findByEmail(String email) {
        return userSettingsRepository.findByEmail(email);
    }

    public UserSettings getById(UUID userId) {
        return userSettingsRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserContextDto getUserContext(UUID userId) {
        UserSettings u = getById(userId);
        return UserContextDto.builder()
            .name(u.getName())
            .voiceProfile(u.getVoiceProfile())
            .build();
    }

    /**
     * Fallback for scheduled jobs that have no HTTP context — returns context for the first user.
     * Safe for a solo app where there is always exactly one user.
     */
    public UserContextDto getUserContextFallback() {
        return userSettingsRepository.findAll().stream()
            .findFirst()
            .map(u -> UserContextDto.builder()
                .name(u.getName())
                .voiceProfile(u.getVoiceProfile())
                .build())
            .orElse(UserContextDto.builder().name("User").voiceProfile(null).build());
    }

    /**
     * Validate email + password. Returns a JWT token string on success, null if credentials invalid.
     */
    public String login(String email, String password) {
        Optional<UserSettings> opt = userSettingsRepository.findByEmail(email);
        if (opt.isEmpty()) return null;
        UserSettings u = opt.get();
        if (!bcrypt.matches(password, u.getPasswordHash())) return null;
        return jwtUtil.generateToken(u.getId().toString());
    }

    public UserSettingsDto updateSettings(UUID userId, String name, String email,
                                          String voiceProfile, Boolean onboardingCompleted) {
        UserSettings u = getById(userId);
        if (name != null) u.setName(name);
        if (email != null) u.setEmail(email);
        if (voiceProfile != null) u.setVoiceProfile(voiceProfile);
        if (onboardingCompleted != null) u.setOnboardingCompleted(onboardingCompleted);
        u.setUpdatedAt(OffsetDateTime.now());
        return toDto(userSettingsRepository.save(u));
    }

    public boolean changePassword(UUID userId, String currentPassword, String newPassword) {
        UserSettings u = getById(userId);
        if (!bcrypt.matches(currentPassword, u.getPasswordHash())) return false;
        u.setPasswordHash(bcrypt.encode(newPassword));
        u.setUpdatedAt(OffsetDateTime.now());
        userSettingsRepository.save(u);
        return true;
    }

    public UserSettingsDto toDto(UserSettings u) {
        return UserSettingsDto.builder()
            .id(u.getId() != null ? u.getId().toString() : null)
            .name(u.getName())
            .email(u.getEmail())
            .voiceProfile(u.getVoiceProfile())
            .onboardingCompleted(u.isOnboardingCompleted())
            .build();
    }
}
