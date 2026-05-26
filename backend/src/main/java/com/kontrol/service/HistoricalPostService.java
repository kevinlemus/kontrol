package com.kontrol.service;

import com.kontrol.model.GlobalPlatformAccount;
import com.kontrol.model.HistoricalPost;
import com.kontrol.model.PlatformVoiceProfile;
import com.kontrol.model.ProjectPlatformAccount;
import com.kontrol.repository.GlobalPlatformAccountRepository;
import com.kontrol.repository.HistoricalPostRepository;
import com.kontrol.repository.PlatformVoiceProfileRepository;
import com.kontrol.repository.ProjectPlatformAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoricalPostService {

    private final HistoricalPostRepository historicalPostRepository;
    private final PlatformVoiceProfileRepository voiceProfileRepository;
    private final GlobalPlatformAccountRepository globalAccountRepository;
    private final ProjectPlatformAccountRepository projectAccountRepository;
    private final ClaudeService claudeService;

    /** Result DTO returned to the controller and then to the frontend. */
    public record ImportResult(int imported, String message, boolean success) {}

    /**
     * Import historical posts for a platform.
     * Checks project-specific account first, falls back to global account.
     * After import, triggers voice analysis asynchronously.
     */
    @Transactional
    public ImportResult importPosts(UUID projectId, String platform) {
        // Resolve token — project-specific first, then global fallback
        String accessToken = resolveAccessToken(projectId, platform);
        if (accessToken == null || accessToken.isBlank()) {
            return new ImportResult(0, "Platform not connected", false);
        }

        List<HistoricalPost> posts = fetchPosts(platform, accessToken, projectId);
        if (posts.isEmpty()) {
            return new ImportResult(0, "No posts found", true);
        }

        // Delete existing imports for this project+platform before re-importing
        historicalPostRepository.deleteByProjectIdAndPlatform(projectId, platform);
        historicalPostRepository.saveAll(posts);

        log.info("Imported {} historical posts for project={} platform={}", posts.size(), projectId, platform);

        // Trigger voice analysis after import
        analyzeVoiceAsync(projectId, platform);

        return new ImportResult(posts.size(), "Imported " + posts.size() + " posts", true);
    }

    /** Get import status for a project+platform. */
    public Map<String, Object> getImportStatus(UUID projectId, String platform) {
        long count = historicalPostRepository.countByProjectIdAndPlatform(projectId, platform);
        Optional<PlatformVoiceProfile> profile = voiceProfileRepository
            .findByProjectIdAndPlatform(projectId, platform);
        Map<String, Object> result = new HashMap<>();
        result.put("postCount", count);
        result.put("hasData", count >= 10);
        result.put("platform", platform);
        profile.ifPresent(p -> {
            result.put("voiceSummary", p.getVoiceSummary());
            result.put("analyzedAt", p.getLastAnalyzedAt());
            result.put("analyzedPostCount", p.getAnalyzedPostCount());
        });
        return result;
    }

    /** Get import status for all platforms for a project. */
    public List<Map<String, Object>> getAllImportStatus(UUID projectId) {
        List<String> platforms = List.of("IG", "TT", "LI", "RD", "X", "FB", "YT", "ST", "IT", "GJ");
        List<Map<String, Object>> results = new ArrayList<>();
        for (String p : platforms) {
            results.add(getImportStatus(projectId, p));
        }
        return results;
    }

    @Async
    public void analyzeVoiceAsync(UUID projectId, String platform) {
        try {
            List<HistoricalPost> posts = historicalPostRepository
                .findByProjectIdAndPlatformOrderByPostedAtDesc(projectId, platform);
            if (posts.size() < 3) return; // Not enough data

            String voiceSummary = claudeService.analyzeVoicePatterns(
                posts.stream().map(HistoricalPost::getContent).toList(), platform);

            // Upsert voice profile
            PlatformVoiceProfile profile = voiceProfileRepository
                .findByProjectIdAndPlatform(projectId, platform)
                .orElseGet(PlatformVoiceProfile::new);
            profile.setProjectId(projectId);
            profile.setPlatform(platform);
            profile.setVoiceSummary(voiceSummary);
            profile.setAnalyzedPostCount(posts.size());
            profile.setLastAnalyzedAt(OffsetDateTime.now());
            voiceProfileRepository.save(profile);

            log.info("Voice profile updated for project={} platform={}", projectId, platform);
        } catch (Exception e) {
            log.warn("Voice analysis failed for project={} platform={}: {}", projectId, platform, e.getMessage());
        }
    }

    private String resolveAccessToken(UUID projectId, String platform) {
        // Check project-specific account first
        if (projectId != null) {
            Optional<ProjectPlatformAccount> projectAcc = projectAccountRepository
                .findByProjectIdAndPlatform(projectId, platform.toUpperCase());
            if (projectAcc.isPresent() && projectAcc.get().getAccessToken() != null) {
                return projectAcc.get().getAccessToken();
            }
        }
        // Fall back to global
        return globalAccountRepository.findByPlatform(platform.toUpperCase())
            .map(GlobalPlatformAccount::getAccessToken)
            .orElse(null);
    }

    /**
     * Fetch posts from the platform API.
     * TODO: Replace stub implementations with real API calls when credentials are live.
     */
    private List<HistoricalPost> fetchPosts(String platform, String accessToken, UUID projectId) {
        return switch (platform.toUpperCase()) {
            case "IG" -> fetchInstagramPosts(accessToken, projectId);
            case "FB" -> fetchFacebookPosts(accessToken, projectId);
            case "LI" -> fetchLinkedInPosts(accessToken, projectId);
            case "X"  -> fetchTwitterPosts(accessToken, projectId);
            case "RD" -> fetchRedditPosts(accessToken, projectId);
            case "YT" -> fetchYouTubePosts(accessToken, projectId);
            case "TT" -> fetchTikTokPosts(accessToken, projectId);
            default   -> List.of();
        };
    }

    // ── Platform-specific fetchers ───────────────────────────────────────────────

    private List<HistoricalPost> fetchInstagramPosts(String accessToken, UUID projectId) {
        // TODO: GET https://graph.facebook.com/v18.0/me/media
        //   ?fields=id,caption,media_type,timestamp,like_count,comments_count
        //   &limit=20&access_token={token}
        log.info("Instagram historical import: TODO — implement Graph API call");
        return List.of(); // Return empty until API is wired
    }

    private List<HistoricalPost> fetchFacebookPosts(String accessToken, UUID projectId) {
        // TODO: GET https://graph.facebook.com/v18.0/me/posts
        //   ?fields=id,message,created_time,likes.summary(true),comments.summary(true)
        //   &limit=20&access_token={token}
        log.info("Facebook historical import: TODO — implement Graph API call");
        return List.of();
    }

    private List<HistoricalPost> fetchLinkedInPosts(String accessToken, UUID projectId) {
        // TODO: GET https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:{id})
        //   Authorization: Bearer {token}
        log.info("LinkedIn historical import: TODO — implement LinkedIn UGC Posts API call");
        return List.of();
    }

    private List<HistoricalPost> fetchTwitterPosts(String accessToken, UUID projectId) {
        // TODO: GET https://api.twitter.com/2/users/{id}/tweets
        //   ?max_results=20&tweet.fields=public_metrics,created_at
        //   Authorization: Bearer {token}
        log.info("X/Twitter historical import: TODO — implement Twitter v2 API call");
        return List.of();
    }

    private List<HistoricalPost> fetchRedditPosts(String accessToken, UUID projectId) {
        // TODO: GET https://oauth.reddit.com/user/{username}/submitted?limit=20
        //   Authorization: Bearer {token}
        log.info("Reddit historical import: TODO — implement Reddit OAuth API call");
        return List.of();
    }

    private List<HistoricalPost> fetchYouTubePosts(String accessToken, UUID projectId) {
        // TODO: GET https://www.googleapis.com/youtube/v3/search
        //   ?part=snippet&forMine=true&type=video&maxResults=20
        //   Authorization: Bearer {token}
        log.info("YouTube historical import: TODO — implement YouTube Data API v3 call");
        return List.of();
    }

    private List<HistoricalPost> fetchTikTokPosts(String accessToken, UUID projectId) {
        // TODO: POST https://open.tiktokapis.com/v2/video/list/
        //   Authorization: Bearer {token}
        log.info("TikTok historical import: TODO — implement TikTok API call");
        return List.of();
    }
}
