package com.kontrol.controller;

import com.kontrol.dto.UserSettingsDto;
import com.kontrol.service.UserSettingsService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserSettingsService userSettingsService;
    private final JwtUtil jwtUtil;

    /** POST /api/v1/auth/login  Body: { "password": "..." } */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password required"));
        }
        String token = userSettingsService.login(password);
        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid password"));
        }
        UserSettingsDto user = userSettingsService.toDto(userSettingsService.getUser());
        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    /** GET /api/v1/auth/me  Header: Authorization: Bearer <token> */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(auth)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        return ResponseEntity.ok(userSettingsService.toDto(userSettingsService.getUser()));
    }

    /** PUT /api/v1/auth/settings  Header: Authorization: Bearer <token> */
    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody UserSettingsDto req) {
        if (!isAuthorized(auth)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        UserSettingsDto updated = userSettingsService.updateSettings(req.getName(), req.getEmail(), req.getVoiceProfile());
        return ResponseEntity.ok(updated);
    }

    /** PUT /api/v1/auth/password  Header: Authorization: Bearer <token> */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, String> body) {
        if (!isAuthorized(auth)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String current = body.get("currentPassword");
        String newPass = body.get("newPassword");
        if (current == null || newPass == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "currentPassword and newPassword required"));
        }
        boolean ok = userSettingsService.changePassword(current, newPass);
        return ok ? ResponseEntity.ok(Map.of("message", "Password updated"))
                  : ResponseEntity.status(401).body(Map.of("error", "Current password incorrect"));
    }

    /**
     * POST /api/v1/auth/setup  — one-time password setup.
     * Only works when password_hash = 'SETUP_REQUIRED' in the DB.
     * Body: { "password": "YourNewPassword" }
     */
    @PostMapping("/setup")
    public ResponseEntity<?> setup(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }
        boolean ok = userSettingsService.setupPassword(password);
        if (!ok) {
            return ResponseEntity.status(403).body(Map.of("error", "Setup already completed or no user row found"));
        }
        return ResponseEntity.ok(Map.of("message", "Password set. You can now log in."));
    }

    private boolean isAuthorized(String authHeader) {
        String token = jwtUtil.extractBearer(authHeader);
        return token != null && userSettingsService.validateToken(token);
    }
}
