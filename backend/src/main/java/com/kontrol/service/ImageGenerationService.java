package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.GenerateImageRequest;
import com.kontrol.dto.GenerateImageResponse;
import com.kontrol.model.GeneratedImage;
import com.kontrol.repository.GeneratedImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageGenerationService {

    private static final String REPLICATE_BASE = "https://api.replicate.com/v1";
    private static final int POLL_INTERVAL_MS = 2000;
    private static final int TIMEOUT_MS = 120_000;

    @Value("${replicate.api.key:}")
    private String replicateApiKey;

    private final ClaudeService claudeService;
    private final GeneratedImageRepository generatedImageRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public GenerateImageResponse generateImage(GenerateImageRequest request) {
        long seed = request.getSeed() != null ? request.getSeed() : Math.abs(random.nextLong());
        String imagePrompt = buildOptimizedPrompt(request.getPrompt(), request.getPlatform(), request.getProjectContext());
        String imageUrl = callReplicate(imagePrompt, request.getPlatform());

        GeneratedImage saved = generatedImageRepository.save(GeneratedImage.builder()
            .imageUrl(imageUrl)
            .imagePrompt(imagePrompt)
            .seed(seed)
            .build());

        return GenerateImageResponse.builder()
            .imageId(saved.getId().toString())
            .imageUrl(imageUrl)
            .imagePrompt(imagePrompt)
            .seed(seed)
            .build();
    }

    public GenerateImageResponse regenerateImage(String imageId, boolean variation) {
        GeneratedImage existing = generatedImageRepository.findById(UUID.fromString(imageId))
            .orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));

        long newSeed = Math.abs(random.nextLong());
        String imagePrompt;

        if (variation) {
            // Call Claude for a completely new prompt
            String systemPrompt = "You are a creative image prompt engineer. Generate a vivid, detailed image generation prompt for FLUX. Return ONLY the prompt text, no explanation.";
            String userMessage = "Create a variation of this concept for social media: " + existing.getImagePrompt();
            imagePrompt = claudeService.callClaudeRaw(systemPrompt, userMessage, 512);
        } else {
            // Reuse stored prompt with new seed
            imagePrompt = existing.getImagePrompt();
        }

        String imageUrl = callReplicate(imagePrompt, null);

        GeneratedImage saved = generatedImageRepository.save(GeneratedImage.builder()
            .imageUrl(imageUrl)
            .imagePrompt(imagePrompt)
            .seed(newSeed)
            .build());

        return GenerateImageResponse.builder()
            .imageId(saved.getId().toString())
            .imageUrl(imageUrl)
            .imagePrompt(imagePrompt)
            .seed(newSeed)
            .build();
    }

    private String buildOptimizedPrompt(String prompt, String platform, Map<String, Object> projectContext) {
        StringBuilder systemSb = new StringBuilder();
        systemSb.append("You are an expert image generation prompt engineer specializing in social media visuals.\n\n");
        systemSb.append("Platform aspect ratios and styles:\n");
        systemSb.append("- Instagram (ig): 1:1 square or 4:5 portrait. Vibrant, polished, high-quality lifestyle/product shots.\n");
        systemSb.append("- TikTok (tt): 9:16 vertical. Dynamic, eye-catching, youthful energy.\n");
        systemSb.append("- LinkedIn (li): 1.91:1 landscape. Professional, clean, business-appropriate.\n");
        systemSb.append("- YouTube (yt): 16:9 landscape thumbnail. Bold text space, high contrast, dramatic.\n");
        systemSb.append("- Twitter/X (x): 16:9 landscape. Clean, shareable.\n");
        systemSb.append("- Facebook (fb): 1.91:1 landscape. Warm, community-focused.\n");
        systemSb.append("- Default: 1:1 square, versatile.\n\n");
        systemSb.append("Generate a vivid, detailed image generation prompt optimized for the given platform. ");
        systemSb.append("Include: subject, style, lighting, mood, composition, color palette. ");
        systemSb.append("Return ONLY the image prompt text. No explanation, no JSON.");

        StringBuilder userSb = new StringBuilder();
        userSb.append("Platform: ").append(platform != null ? platform : "general").append("\n");
        if (projectContext != null && !projectContext.isEmpty()) {
            userSb.append("Project context: ").append(projectContext).append("\n");
        }
        userSb.append("Content concept: ").append(prompt);

        return claudeService.callClaudeRaw(systemSb.toString(), userSb.toString(), 512);
    }

    private String getAspectRatio(String platform) {
        if (platform == null) return "1:1";
        return switch (platform.toLowerCase()) {
            case "ig_story", "tt", "reels", "yt_short" -> "9:16";
            case "yt"                                   -> "16:9";
            case "li", "x"                              -> "1.91:1";
            default                                     -> "1:1"; // ig feed, fb, and everything else
        };
    }

    private String callReplicate(String prompt, String platform) {
        if (replicateApiKey == null || replicateApiKey.isBlank()) {
            log.warn("REPLICATE_API_KEY not set — returning placeholder image URL");
            return "https://placehold.co/1024x1024?text=Image+Generation+Disabled";
        }

        WebClient client = webClientBuilder.build();

        // Submit prediction to flux-2-pro
        Map<String, Object> body = Map.of(
            "input", Map.of(
                "prompt",         prompt,
                "aspect_ratio",   getAspectRatio(platform),
                "output_format",  "webp",
                "output_quality", 90
            )
        );

        String submitResponse;
        try {
            submitResponse = client.post()
                .uri(REPLICATE_BASE + "/models/black-forest-labs/flux-2-pro/predictions")
                .header("Authorization", "Token " + replicateApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        } catch (Exception e) {
            log.error("Replicate submit failed: {}", e.getMessage(), e);
            throw new RuntimeException("Image generation failed: " + e.getMessage(), e);
        }

        String predictionId;
        try {
            JsonNode submitNode = objectMapper.readTree(submitResponse);
            predictionId = submitNode.path("id").asText();
            if (predictionId == null || predictionId.isBlank()) {
                throw new RuntimeException("No prediction ID in Replicate response");
            }
        } catch (Exception e) {
            log.error("Failed to parse Replicate submit response: {}", submitResponse, e);
            throw new RuntimeException("Failed to parse Replicate response: " + e.getMessage(), e);
        }

        // Poll until done
        long deadline = System.currentTimeMillis() + TIMEOUT_MS;
        while (System.currentTimeMillis() < deadline) {
            try {
                Thread.sleep(POLL_INTERVAL_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Image generation interrupted");
            }

            String pollResponse;
            try {
                pollResponse = client.get()
                    .uri(REPLICATE_BASE + "/predictions/" + predictionId)
                    .header("Authorization", "Token " + replicateApiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            } catch (Exception e) {
                log.warn("Replicate poll error: {}", e.getMessage());
                continue;
            }

            try {
                JsonNode pollNode = objectMapper.readTree(pollResponse);
                String status = pollNode.path("status").asText();

                if ("succeeded".equals(status)) {
                    JsonNode output = pollNode.path("output");
                    // flux-2-pro returns a direct URL string; flux-schnell returned an array.
                    // Handle both shapes for safety.
                    if (output.isTextual()) {
                        return output.asText();
                    }
                    if (output.isArray() && output.size() > 0) {
                        return output.get(0).asText();
                    }
                    throw new RuntimeException("Replicate succeeded but no output URL found");
                } else if ("failed".equals(status) || "canceled".equals(status)) {
                    String error = pollNode.path("error").asText("unknown error");
                    throw new RuntimeException("Replicate prediction failed: " + error);
                }
                // status is "starting" or "processing" — continue polling
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Failed to parse poll response: {}", e.getMessage());
            }
        }

        throw new RuntimeException("Image generation timed out after 120 seconds");
    }
}
