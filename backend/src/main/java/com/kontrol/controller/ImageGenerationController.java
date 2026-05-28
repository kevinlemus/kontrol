package com.kontrol.controller;

import com.kontrol.dto.GenerateImageRequest;
import com.kontrol.dto.GenerateImageResponse;
import com.kontrol.dto.RegenerateImageRequest;
import com.kontrol.service.ImageGenerationService;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// BACKEND-AGENT: POST /api/v1/generate/image complete
// BACKEND-AGENT: POST /api/v1/generate/image/regenerate complete
@RestController
@RequestMapping("/api/v1/generate")
@RequiredArgsConstructor
@Slf4j
public class ImageGenerationController {

    private final ImageGenerationService imageGenerationService;
    private final JwtUtil jwtUtil;

    @PostMapping("/image")
    public ResponseEntity<?> generateImage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody GenerateImageRequest request) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            GenerateImageResponse response = imageGenerationService.generateImage(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Image generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Image generation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/image/regenerate")
    public ResponseEntity<?> regenerateImage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RegenerateImageRequest request) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            GenerateImageResponse response = imageGenerationService.regenerateImage(
                request.getImageId(), request.isVariation());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Image regeneration failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Image regeneration failed: " + e.getMessage()));
        }
    }
}
