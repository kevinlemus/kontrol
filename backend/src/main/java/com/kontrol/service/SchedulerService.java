package com.kontrol.service;

import com.kontrol.dto.PublishResult;
import com.kontrol.model.Post;
import com.kontrol.model.PostPlatform;
import com.kontrol.model.ScheduledPost;
import com.kontrol.repository.PostPlatformRepository;
import com.kontrol.repository.PostRepository;
import com.kontrol.repository.ScheduledPostRepository;
import com.kontrol.service.platform.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostPlatformRepository postPlatformRepository;
    private final PostRepository postRepository;
    private final InstagramService instagramService;
    private final TikTokService tiktokService;
    private final LinkedInService linkedInService;
    private final RedditService redditService;
    private final TwitterService twitterService;
    private final FacebookService facebookService;
    private final YouTubeService youTubeService;
    private final SteamService steamService;
    private final ItchioService itchioService;
    private final GameJoltService gameJoltService;

    @Scheduled(fixedRate = 60_000)
    public void processScheduledPosts() {
        List<ScheduledPost> due = scheduledPostRepository
            .findByStatusAndScheduledAtLessThanEqual("pending", OffsetDateTime.now());
        log.debug("Scheduler tick: {} posts due", due.size());
        for (ScheduledPost sp : due) {
            try { publish(sp); }
            catch (Exception e) { log.error("Scheduler error for {}: {}", sp.getId(), e.getMessage(), e); }
        }
    }

    private void publish(ScheduledPost sp) {
        sp.setStatus("processing");
        scheduledPostRepository.save(sp);

        Post post = postRepository.findById(sp.getPostId()).orElse(null);
        if (post == null) { sp.setStatus("failed"); scheduledPostRepository.save(sp); return; }

        List<PostPlatform> platforms = postPlatformRepository
            .findByPostIdAndStatus(sp.getPostId(), "approved");

        boolean anyFailed = false;
        for (PostPlatform pp : platforms) {
            try {
                PublishResult r = dispatch(pp, post);
                pp.setStatus(r.isSuccess() ? "published" : "failed");
                pp.setErrorMessage(r.getErrorMessage());
                pp.setPlatformPostId(r.getPlatformPostId());
                if (r.isSuccess()) pp.setPublishedAt(OffsetDateTime.now());
                postPlatformRepository.save(pp);
                if (!r.isSuccess()) anyFailed = true;
                log.info("Published {} -> {}: ok={}", sp.getPostId(), pp.getPlatform(), r.isSuccess());
            } catch (Exception e) {
                pp.setStatus("failed"); pp.setErrorMessage(e.getMessage());
                postPlatformRepository.save(pp); anyFailed = true;
                log.error("Publish error {} -> {}: {}", sp.getPostId(), pp.getPlatform(), e.getMessage());
            }
        }

        sp.setStatus(anyFailed ? "partial" : "completed");
        sp.setExecutedAt(OffsetDateTime.now());
        scheduledPostRepository.save(sp);
        post.setStatus(anyFailed ? "partial" : "published");
        if (!anyFailed) post.setPublishedAt(OffsetDateTime.now());
        postRepository.save(post);
    }

    private PublishResult dispatch(PostPlatform pp, Post post) {
        return switch (pp.getPlatform()) {
            case "IG" -> instagramService.publishPost(pp.getContent(), post.getMediaUrl());
            case "TT" -> tiktokService.publishPost(pp.getContent(), post.getMediaUrl());
            case "LI" -> linkedInService.publishPost(pp.getContent());
            case "RD" -> redditService.publishPost(pp.getContent());
            case "X"  -> twitterService.publishPost(pp.getContent());
            case "FB" -> facebookService.publishPost(pp.getContent());
            case "YT" -> youTubeService.publishPost(pp.getContent(), pp.getPostType());
            case "ST" -> steamService.publishUpdate(pp.getContent());
            case "IT" -> itchioService.publishUpdate(pp.getContent());
            case "GJ" -> gameJoltService.publishUpdate(pp.getContent());
            default   -> PublishResult.builder().success(false)
                .errorMessage("Unknown platform: " + pp.getPlatform()).build();
        };
    }
}
