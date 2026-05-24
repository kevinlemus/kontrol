package com.kontrol.controller;

import com.kontrol.dto.CreateProjectRequest;
import com.kontrol.dto.ProjectDto;
import com.kontrol.model.Project;
import com.kontrol.repository.ProjectRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/projects complete
// BACKEND-AGENT: POST /api/v1/projects complete
// BACKEND-AGENT: PUT /api/v1/projects/{id} complete
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> listProjects() {
        return ResponseEntity.ok(projectRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProject(@PathVariable UUID id) {
        return projectRepository.findById(id)
            .map(p -> ResponseEntity.ok(toDto(p)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(@RequestBody @Valid CreateProjectRequest req) {
        Project p = Project.builder()
            .name(req.getName()).whatItIs(req.getWhatItIs())
            .whoItsFor(req.getWhoItsFor()).vibe(req.getVibe())
            .currentStatus(req.getCurrentStatus()).active(false).build();
        return ResponseEntity.status(201).body(toDto(projectRepository.save(p)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(@PathVariable UUID id,
                                                     @RequestBody CreateProjectRequest req) {
        return projectRepository.findById(id).map(p -> {
            p.setName(req.getName()); p.setWhatItIs(req.getWhatItIs());
            p.setWhoItsFor(req.getWhoItsFor()); p.setVibe(req.getVibe());
            p.setCurrentStatus(req.getCurrentStatus());
            return ResponseEntity.ok(toDto(projectRepository.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable UUID id) {
        projectRepository.findAll().forEach(p -> {
            p.setActive(p.getId().equals(id));
            projectRepository.save(p);
        });
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ProjectDto toDto(Project p) {
        return ProjectDto.builder()
            .id(p.getId().toString()).name(p.getName())
            .whatItIs(p.getWhatItIs()).whoItsFor(p.getWhoItsFor())
            .vibe(p.getVibe()).currentStatus(p.getCurrentStatus())
            .active(p.isActive()).build();
    }
}
