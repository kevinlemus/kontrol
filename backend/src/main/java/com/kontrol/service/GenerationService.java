package com.kontrol.service;

import com.kontrol.dto.DraftDto;
import com.kontrol.dto.GenerateRequest;
import com.kontrol.dto.GenerateResponse;
import com.kontrol.dto.PerformanceInsightDto;
import com.kontrol.dto.ProjectContextDto;
import com.kontrol.dto.UserContextDto;
import com.kontrol.model.Post;
import com.kontrol.model.PostPlatform;
import com.kontrol.model.SubredditMonitor;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.PostRepository;
import com.kontrol.repository.ProjectRepository;
import com.kontrol.repository.SubredditMonitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.HashMap;
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
    private final SubredditMonitorRepository subredditMonitorRepository;
    private final PerformanceService performanceService;
    private final UserSettingsService userSettingsService;

    public GenerateResponse generate(GenerateRequest request) {
        UUID projectId = UUID.fromString(request.getProjectId());

        var project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        UserContextDto userContext = userSettingsService.getUserContextFallback();

        List<Post> recentPosts = postRepository.findTop10ByProjectIdOrderByCreatedAtDesc(projectId);

        ProjectContextDto projectContext = ProjectContextDto.builder()
            .name(project.getName())
            .whatItIs(project.getWhatItIs())
            .whoItsFor(project.getWhoItsFor())
            .vibe(project.getVibe())
            .currentStatus(project.getCurrentStatus())
            .industry(project.getIndustry())
            .competitor1(project.getCompetitor1())
            .competitor2(project.getCompetitor2())
            .competitor3(project.getCompetitor3())
            .projectContextText(project.getProjectContextText())
            .contextSource(project.getContextSource())
            .build();

        // Fetch performance insights per platform
        List<PerformanceInsightDto> insights = request.getPlatforms().stream()
            .map(pid -> performanceService.getInsightsForProject(projectId, pid))
            .toList();

        // Fetch subreddit performance scores for Reddit platform weighting
        Map<String, Double> subredditScores = Map.of();
        if (request.getPlatforms().contains("RD")) {
            subredditScores = performanceService.getSubredditScores(projectId);
        }

        // For Reddit: fetch monitored subreddits, filter by cooldown
        List<String> eligibleSubreddits = List.of();
        List<String> allSubreddits = List.of();
        if (request.getPlatforms().contains("RD")) {
            OffsetDateTime cooldownCutoff = OffsetDateTime.now().minusHours(48);
            List<SubredditMonitor> eligible = subredditMonitorRepository
                .findEligibleByProjectId(projectId, cooldownCutoff);
            List<SubredditMonitor> all = subredditMonitorRepository
                .findByProjectIdAndActiveTrue(projectId);
            eligibleSubreddits = eligible.stream().map(SubredditMonitor::getSubreddit).toList();
            allSubreddits = all.stream().map(SubredditMonitor::getSubreddit).toList();
        }

        // Fetch Tier 2 edit history per platform (up to 5 overridden posts each)
        Map<String, List<PostPlatform>> editHistoryByPlatform = new HashMap<>();
        for (String platform : request.getPlatforms()) {
            List<PostPlatform> history = postPlatformRepository
                .findRecentEditsForProjectAndPlatform(projectId.toString(), platform, 5);
            if (!history.isEmpty()) {
                editHistoryByPlatform.put(platform, history);
            }
        }

        Map<String, DraftDto> drafts = claudeService.generatePosts(
            projectContext, userContext, recentPosts, request.getPrompt(), request.getPlatforms(),
            eligibleSubreddits, allSubreddits, insights, subredditScores, editHistoryByPlatform
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
            PostPlatform.PostPlatformBuilder builder = PostPlatform.builder()
                .postId(post.getId())
                .platform(entry.getKey())
                .content(entry.getValue().getContent())
                .originalContent(entry.getValue().getContent())
                .postType(entry.getValue().getPostType())
                .status("pending");

            // Persist subreddit selection for Reddit posts
            if ("RD".equals(entry.getKey()) && entry.getValue().getSelectedSubreddit() != null) {
                String extraData = String.format(
                    "{\"selectedSubreddit\":\"%s\",\"subredditReasoning\":\"%s\"}",
                    entry.getValue().getSelectedSubreddit(),
                    entry.getValue().getSubredditReasoning() != null
                        ? entry.getValue().getSubredditReasoning().replace("\"", "'") : ""
                );
                builder.extraData(extraData);
            }

            PostPlatform savedPp = postPlatformRepository.save(builder.build());
            entry.getValue().setPostPlatformId(savedPp.getId().toString());
        }

        return GenerateResponse.builder()
            .postId(post.getId().toString())
            .drafts(drafts)
            .insights(insights)
            .build();
    }

}
