package com.kontrol.controller;

import com.kontrol.dto.CreateProjectRequest;
import com.kontrol.dto.ProjectDto;
import com.kontrol.model.Project;
import com.kontrol.repository.ProjectRepository;
import com.kontrol.service.DocumentExtractorService;
import com.kontrol.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

// BACKEND-AGENT: GET /api/v1/projects complete
// BACKEND-AGENT: POST /api/v1/projects complete
// BACKEND-AGENT: PUT /api/v1/projects/{id} complete
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final DocumentExtractorService documentExtractorService;
    private final JwtUtil jwtUtil;

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
    public ResponseEntity<?> createProject(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateProjectRequest req) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Project p = Project.builder()
            .name(req.getName()).whatItIs(req.getWhatItIs())
            .whoItsFor(req.getWhoItsFor())
            .currentStatus(req.getCurrentStatus()).active(false)
            .competitor1(req.getCompetitor1()).competitor2(req.getCompetitor2())
            .competitor3(req.getCompetitor3()).industry(req.getIndustry())
            .projectContextText(req.getProjectContextText())
            .contextSource(req.getContextSource())
            .phone(req.getPhone()).bookingUrl(req.getBookingUrl()).serviceArea(req.getServiceArea())
            .build();
        return ResponseEntity.status(201).body(toDto(projectRepository.save(p)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id,
            @RequestBody CreateProjectRequest req) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return projectRepository.findById(id).map(p -> {
            p.setName(req.getName()); p.setWhatItIs(req.getWhatItIs());
            p.setWhoItsFor(req.getWhoItsFor());
            p.setCurrentStatus(req.getCurrentStatus());
            p.setCompetitor1(req.getCompetitor1()); p.setCompetitor2(req.getCompetitor2());
            p.setCompetitor3(req.getCompetitor3()); p.setIndustry(req.getIndustry());
            p.setProjectContextText(req.getProjectContextText());
            p.setContextSource(req.getContextSource());
            p.setPhone(req.getPhone()); p.setBookingUrl(req.getBookingUrl()); p.setServiceArea(req.getServiceArea());
            return ResponseEntity.ok((Object) toDto(projectRepository.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<?> activate(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        projectRepository.findAll().forEach(p -> {
            p.setActive(p.getId().equals(id));
            projectRepository.save(p);
        });
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID id) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/v1/projects/{projectId}/upload-context
    // Content-Type: multipart/form-data
    // Accepts up to 5 files, max 10MB each
    // Extracts text, appends to project.projectContextText, saves
    @PostMapping(value = "/{projectId}/upload-context", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadContext(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID projectId,
            @RequestParam("files") List<MultipartFile> files) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return projectRepository.findById(projectId)
                .map(project -> {
                    if (files.size() > 5) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Maximum 5 files allowed"));
                    }

                    StringBuilder extracted = new StringBuilder();
                    for (MultipartFile file : files) {
                        if (file.getSize() > 10 * 1024 * 1024) {
                            log.warn("File {} exceeds 10MB, skipping", file.getOriginalFilename());
                            continue;
                        }
                        String text = documentExtractorService.extractText(file);
                        if (!text.isBlank()) {
                            extracted.append("\n--- ").append(file.getOriginalFilename()).append(" ---\n");
                            extracted.append(text.trim()).append("\n");
                        }
                    }

                    if (extracted.length() > 0) {
                        String existing = project.getProjectContextText();
                        String newContext = (existing != null && !existing.isBlank())
                                ? existing + "\n" + extracted
                                : extracted.toString();
                        project.setProjectContextText(newContext);

                        // Track context source
                        String currentSource = project.getContextSource();
                        if (currentSource == null) {
                            project.setContextSource("document");
                        } else if (!currentSource.contains("document")) {
                            project.setContextSource("mixed");
                        }

                        projectRepository.save(project);
                    }

                    return ResponseEntity.ok(Map.of(
                            "extracted", extracted.length() > 0,
                            "characters", extracted.length(),
                            "message", "Context extracted from " + files.size() + " file(s)"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/projects/{projectId}/context-document
    // Accepts a single multipart file, extracts text, appends to projectContextText.
    @PostMapping(value = "/{projectId}/context-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadContextDocument(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File exceeds 10MB limit"));
        }

        return projectRepository.findById(projectId)
                .map(project -> {
                    String extracted = documentExtractorService.extractText(file);

                    if (!extracted.isBlank()) {
                        String separator = "\n--- " + file.getOriginalFilename() + " ---\n";
                        String existing = project.getProjectContextText();
                        String newContext = (existing != null && !existing.isBlank())
                                ? existing + separator + extracted.trim() + "\n"
                                : separator + extracted.trim() + "\n";
                        project.setProjectContextText(newContext);

                        String currentSource = project.getContextSource();
                        if (currentSource == null) {
                            project.setContextSource("document");
                        } else if (!currentSource.equals("document") && !currentSource.equals("mixed")) {
                            project.setContextSource("mixed");
                        }

                        projectRepository.save(project);
                    }

                    return ResponseEntity.ok((Object) toDto(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/v1/projects/{projectId}/context-text
    // Replaces projectContextText with the provided text body.
    @PutMapping("/{projectId}/context-text")
    public ResponseEntity<?> updateContextText(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> body) {
        String token = jwtUtil.extractBearer(authHeader);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return projectRepository.findById(projectId)
                .map(project -> {
                    String text = body.get("text");
                    project.setProjectContextText(text);

                    String currentSource = project.getContextSource();
                    if (currentSource == null) {
                        project.setContextSource("manual");
                    } else if (!currentSource.equals("manual") && !currentSource.equals("mixed")) {
                        project.setContextSource("mixed");
                    }

                    projectRepository.save(project);
                    return ResponseEntity.ok((Object) toDto(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private ProjectDto toDto(Project p) {
        return ProjectDto.builder()
            .id(p.getId().toString()).name(p.getName())
            .whatItIs(p.getWhatItIs()).whoItsFor(p.getWhoItsFor())
            .currentStatus(p.getCurrentStatus())
            .active(p.isActive())
            .competitor1(p.getCompetitor1()).competitor2(p.getCompetitor2())
            .competitor3(p.getCompetitor3()).industry(p.getIndustry())
            .projectContextText(p.getProjectContextText())
            .contextSource(p.getContextSource())
            .phone(p.getPhone()).bookingUrl(p.getBookingUrl()).serviceArea(p.getServiceArea())
            .build();
    }
}
