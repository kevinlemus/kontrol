package com.kontrol.controller;

import com.kontrol.service.ClaudeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

// BACKEND-AGENT: POST /api/v1/projects/analyze-url complete

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectAnalysisController {

    private final ClaudeService claudeService;

    @PostMapping("/analyze-url")
    public ResponseEntity<?> analyzeUrl(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "url required"));
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("User-Agent", "Mozilla/5.0 (compatible; KontrolBot/1.0)")
                .GET()
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String html = response.body();

            // Strip script and style blocks first
            String noScript = html.replaceAll("(?is)<script[^>]*>.*?</script>", " ");
            String noStyle = noScript.replaceAll("(?is)<style[^>]*>.*?</style>", " ");
            // Strip all remaining HTML tags
            String text = noStyle.replaceAll("<[^>]+>", " ");
            // Collapse whitespace
            text = text.replaceAll("\\s+", " ").trim();
            // Limit to first 3000 chars
            if (text.length() > 3000) text = text.substring(0, 3000);

            boolean isSocial = url.contains("instagram.com")
                || url.contains("linkedin.com")
                || url.contains("twitter.com")
                || url.contains("x.com");

            Map<String, String> result = claudeService.analyzeWebsite(text, isSocial);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("URL analysis failed for {}: {}", url, e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to analyze URL: " + e.getMessage()));
        }
    }
}
