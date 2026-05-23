package com.kontrol.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// BACKEND-AGENT: Core generation endpoint.
// 1. Assemble context: voice profile + project fields + last 10 posts + user input
// 2. Call Claude API (claude-sonnet-4-20250514)
// 3. Parse JSON response → extract drafts per platform
// 4. Save post + post_platforms records (status=pending)
// 5. Return post ID + drafts
@RestController
@RequestMapping("/api/v1")
public class GenerateController {

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Object dto) {
        // TODO: implement generation flow
        throw new UnsupportedOperationException("Sprint 2");
    }

    @PostMapping("/intake")
    public ResponseEntity<?> intake(@RequestBody Object dto) {
        // TODO: Dispatch/Cowork intake endpoint
        // Accepts: { project_id, content, source: "dispatch" }
        // Triggers full generation flow, queues drafts, sends PWA push notification
        throw new UnsupportedOperationException("Sprint 2");
    }

    @PostMapping("/publish/{postId}")
    public ResponseEntity<?> publish(@PathVariable String postId) {
        // TODO: publish all approved platforms for this post
        throw new UnsupportedOperationException("Sprint 2");
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(@RequestBody Object dto) {
        // TODO: schedule post for later datetime
        throw new UnsupportedOperationException("Sprint 2");
    }
}
