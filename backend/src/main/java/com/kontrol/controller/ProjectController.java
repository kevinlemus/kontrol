package com.kontrol.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// BACKEND-AGENT: Implement fully. Wire to ProjectService → ProjectRepository.
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    @GetMapping
    public ResponseEntity<?> listProjects() {
        // TODO: return all projects
        throw new UnsupportedOperationException("Sprint 2");
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Object dto) {
        // TODO: create project
        throw new UnsupportedOperationException("Sprint 2");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody Object dto) {
        // TODO: update project (name, what_it_is, who_its_for, vibe, current_status)
        throw new UnsupportedOperationException("Sprint 2");
    }
}
