package com.kontrol.service;

import com.kontrol.dto.DraftDto;
import com.kontrol.dto.GenerateRequest;
import com.kontrol.dto.GenerateResponse;
import com.kontrol.model.Post;
import com.kontrol.model.PostPlatform;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.PostRepository;
import com.kontrol.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenerationService {

    private final ProjectRepository projectRepository;
    private final PostRepository postRepository;
    private final PostPlatformRepository postPlatformRepository;
    private final ClaudeService claudeService;

    public GenerateResponse generate(GenerateRequest request) {
        UUID projectId = UUID.fromString(request.getProjectId());

        var project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        List<Post> recentPosts = postRepository.findTop10ByProjectIdOrderByCreatedAtDesc(projectId);

        String context = String.format(
            "Name: %s\nWhat it is: %s\nWho it's for: %s\nVibe: %s\nCurrent status: %s",
            project.getName(),
            nvl(project.getWhatItIs()),
            nvl(project.getWhoItsFor()),
            nvl(project.getVibe()),
            nvl(project.getCurrentStatus())
        );

        Map<String, DraftDto> drafts = claudeService.generatePosts(
            project.getName(), context, recentPosts, request.getPrompt(), request.getPlatforms()
        );

        Post post = Post.builder()
            .projectId(projectId)
            .inputType("text")
            .inputContent(request.getPrompt())
            .status("draft")
            .source("manual")
            .build();
        post = postRepository.save(post);

        for (Map.Entry<String, DraftDto> entry : drafts.entrySet()) {
            postPlatformRepository.save(PostPlatform.builder()
                .postId(post.getId())
                .platform(entry.getKey())
                .content(entry.getValue().getContent())
                .postType(entry.getValue().getPostType())
                .status("pending")
                .build());
        }

        return GenerateResponse.builder()
            .postId(post.getId().toString())
            .drafts(drafts)
            .build();
    }

    private String nvl(String s) { return s != null ? s : "N/A"; }
}
