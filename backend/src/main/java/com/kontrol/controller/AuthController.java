package com.kontrol.controller;

import com.kontrol.dto.UserSettingsDto;
import com.kontrol.service.UserSettingsService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserSettingsService userSettingsService;
    private final JwtUtil jwtUtil;
    private final WebClient.Builder webClientBuilder;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.anon-key:}")
    private String supabaseAnonKey;

    private static final List<String> ALLOWED_IMAGE_TYPES =
        List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    // BACKEND-AGENT: POST /api/v1/auth/register complete

    /** POST /api/v1/auth/register  Body: { "name": "...", "email": "...", "password": "..." } */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "name required"));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email required"));
        }
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "password required"));
        }
        try {
            UserSettingsDto user = userSettingsService.register(name, email, password);
            String token = userSettingsService.generateTokenForUser(UUID.fromString(user.getId()));
            return ResponseEntity.ok(Map.of("token", token, "user", user));
        } catch (RuntimeException e) {
            if ("Email already registered".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "Email already registered"));
            }
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Registration failed"));
        }
    }

    // BACKEND-AGENT: POST /api/v1/auth/login complete

    /** POST /api/v1/auth/login  Body: { "email": "...", "password": "..." } */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email required"));
        }
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "password required"));
        }
        String token = userSettingsService.login(email, password);
        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        String userId = jwtUtil.extractUserId(token);
        UserSettingsDto user = userSettingsService.toDto(
            userSettingsService.getById(UUID.fromString(userId)));
        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    // BACKEND-AGENT: GET /api/v1/auth/me complete

    /** GET /api/v1/auth/me  Header: Authorization: Bearer <token> */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        UUID userId = extractUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            UserSettingsDto dto = userSettingsService.toDto(userSettingsService.getById(userId));
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
    }

    // BACKEND-AGENT: PUT /api/v1/auth/settings complete

    /** PUT /api/v1/auth/settings  Header: Authorization: Bearer <token> */
    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        UUID userId = extractUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String voiceProfile = (String) body.get("voiceProfile");
        // snake_case alias for when frontend sends voice_profile
        if (voiceProfile == null) voiceProfile = (String) body.get("voice_profile");
        Boolean onboardingCompleted = body.get("onboardingCompleted") instanceof Boolean b ? b
            : body.get("onboarding_completed") instanceof Boolean b2 ? b2 : null;
        // Required when email is changing
        String currentPassword = (String) body.get("currentPassword");
        if (currentPassword == null) currentPassword = (String) body.get("current_password");
        try {
            UserSettingsDto updated = userSettingsService.updateSettings(
                userId, name, email, voiceProfile, onboardingCompleted, currentPassword);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // BACKEND-AGENT: PUT /api/v1/auth/password complete

    /** PUT /api/v1/auth/password  Header: Authorization: Bearer <token> */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, String> body) {
        UUID userId = extractUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String current = body.get("currentPassword");
        String newPass = body.get("newPassword");
        // snake_case aliases
        if (current == null) current = body.get("current_password");
        if (newPass == null) newPass = body.get("new_password");
        if (current == null || newPass == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "currentPassword and newPassword required"));
        }
        boolean ok = userSettingsService.changePassword(userId, current, newPass);
        return ok
            ? ResponseEntity.ok(Map.of("message", "Password updated"))
            : ResponseEntity.status(401).body(Map.of("error", "Current password incorrect"));
    }

    // BACKEND-AGENT: POST /api/v1/auth/avatar complete

    /**
     * POST /api/v1/auth/avatar
     * Form-data field: avatar (MultipartFile)
     * Header: Authorization: Bearer <token>
     * Uploads image to Supabase Storage bucket "avatars", updates user's avatar_url.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar) {

        UUID userId = extractUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        if (avatar == null || avatar.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        String contentType = avatar.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Unsupported image type. Allowed: jpeg, png, webp, gif"));
        }

        if (supabaseUrl.isBlank() || supabaseAnonKey.isBlank()) {
            log.warn("Supabase URL or anon key not configured — cannot upload avatar");
            return ResponseEntity.status(503).body(Map.of("error", "Storage not configured"));
        }

        try {
            String originalFilename = avatar.getOriginalFilename();
            String filename = (originalFilename != null && !originalFilename.isBlank())
                ? originalFilename
                : "avatar." + contentType.split("/")[1];

            // Sanitize filename to prevent path traversal
            filename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");

            String storagePath = userId + "/" + filename;
            String uploadUrl = supabaseUrl + "/storage/v1/object/avatars/" + storagePath;

            byte[] bytes = avatar.getBytes();

            // Upload to Supabase Storage
            webClientBuilder.build()
                .post()
                .uri(uploadUrl)
                .header("Authorization", "Bearer " + supabaseAnonKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .bodyValue(bytes)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            // Build the public URL
            String publicUrl = supabaseUrl + "/storage/v1/object/public/avatars/" + storagePath;

            // Persist avatar_url on the user record
            userSettingsService.updateAvatarUrl(userId, publicUrl);

            log.info("Avatar uploaded for user {}: {}", userId, publicUrl);
            return ResponseEntity.ok(Map.of("avatar_url", publicUrl));

        } catch (Exception e) {
            log.error("Avatar upload failed for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed"));
        }
    }

    private UUID extractUserId(String authHeader) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) return null;
        try {
            return UUID.fromString(jwtUtil.extractUserId(token));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
