package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.PerformanceInsightDto;
import com.kontrol.dto.SmartScheduleTimingDto;
import com.kontrol.model.PostPlatform;
import com.kontrol.repository.PostPlatformRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceService {

    private final PostPlatformRepository postPlatformRepository;
    private final ObjectMapper objectMapper;

    private record Metrics(int likes, int comments, int shares) {}

    // Default optimal posting times: platform -> [hour(0-23), dayOfWeek(1-7 Mon=1)]
    private static final Map<String, int[]> DEFAULTS = Map.of(
        "IG", new int[]{20, 3}, "TT", new int[]{19, 4},
        "LI", new int[]{8, 2},  "RD", new int[]{10, 3},
        "X",  new int[]{9, 3},  "FB", new int[]{13, 4},
        "YT", new int[]{15, 5}, "ST", new int[]{18, 5},
        "IT", new int[]{20, 6}, "GJ", new int[]{20, 6}
    );

    @Scheduled(fixedRate = 3_600_000)
    public void checkPerformance() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(48);
        List<PostPlatform> due = postPlatformRepository.findDueForPerformanceCheck(cutoff);
        log.info("Performance check: {} posts due for metrics fetch", due.size());
        for (PostPlatform pp : due) {
            try {
                Metrics m = fetchMetrics(pp);
                pp.setLikes(m.likes());
                pp.setComments(m.comments());
                pp.setShares(m.shares());
                int score = m.likes() + (m.comments() * 3) + (m.shares() * 5);
                pp.setPerformanceScore(BigDecimal.valueOf(score));
                pp.setPerformanceCheckedAt(OffsetDateTime.now());
                postPlatformRepository.save(pp);
                log.info("Performance updated for pp {}: score={}", pp.getId(), score);
            } catch (Exception e) {
                log.error("Performance check failed for pp {}: {}", pp.getId(), e.getMessage());
            }
        }
    }

    private Metrics fetchMetrics(PostPlatform pp) {
        return switch (pp.getPlatform()) {
            case "IG" -> {
                // TODO: Instagram Graph API
                // GET https://graph.instagram.com/{media-id}?fields=like_count,comments_count&access_token={token}
                // pp.getPlatformPostId() is the media ID
                yield new Metrics(0, 0, 0);
            }
            case "TT" -> {
                // TODO: TikTok Research API
                // GET https://open.tiktokapis.com/v2/video/query/?fields=like_count,comment_count,share_count
                yield new Metrics(0, 0, 0);
            }
            case "LI" -> {
                // TODO: LinkedIn Share Statistics API
                // GET https://api.linkedin.com/v2/socialActions/{shareUrn}?fields=likesSummary,commentsSummary
                yield new Metrics(0, 0, 0);
            }
            case "RD" -> {
                // TODO: Reddit API — upvotes + comments
                // GET https://oauth.reddit.com/by_id/t3_{platformPostId}
                // Fields: data.ups (upvotes as likes), data.num_comments
                yield new Metrics(0, 0, 0);
            }
            case "X" -> {
                // TODO: Twitter API v2
                // GET https://api.twitter.com/2/tweets/{id}?tweet.fields=public_metrics
                // Fields: like_count, reply_count, retweet_count (retweets as shares)
                yield new Metrics(0, 0, 0);
            }
            case "FB" -> {
                // TODO: Facebook Graph API
                // GET https://graph.facebook.com/{post-id}?fields=reactions.summary(true),comments.summary(true),shares&access_token={token}
                yield new Metrics(0, 0, 0);
            }
            case "YT" -> {
                // TODO: YouTube Data API v3
                // GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={videoId}&key={apiKey}
                // Fields: likeCount, commentCount, favoriteCount
                yield new Metrics(0, 0, 0);
            }
            case "ST" -> {
                // TODO: Steam does not expose per-post engagement via public API
                // Consider tracking store page follower count or workshop item stats instead
                yield new Metrics(0, 0, 0);
            }
            case "IT" -> {
                // TODO: itch.io has limited engagement API; consider webhook or manual entry
                yield new Metrics(0, 0, 0);
            }
            case "GJ" -> {
                // TODO: Game Jolt engagement API — check GameJolt.com/developers for post stats endpoints
                yield new Metrics(0, 0, 0);
            }
            default -> new Metrics(0, 0, 0);
        };
    }

    public PerformanceInsightDto getInsightsForProject(UUID projectId, String platform) {
        List<PostPlatform> posts = postPlatformRepository
            .findTop30PublishedByProjectAndPlatform(projectId.toString(), platform);
        int total = postPlatformRepository
            .countPublishedByProjectAndPlatform(projectId.toString(), platform);

        boolean hasEnoughData = total >= 10;

        List<PostPlatform> overridden = posts.stream()
            .filter(p -> Boolean.TRUE.equals(p.getWasOverridden())).toList();
        List<PostPlatform> notOverridden = posts.stream()
            .filter(p -> !Boolean.TRUE.equals(p.getWasOverridden())).toList();

        Double overrideAvg = averageScore(overridden);
        Double claudeAvg = averageScore(notOverridden);
        Double improvementPct = null;
        if (overrideAvg != null && claudeAvg != null && claudeAvg > 0) {
            improvementPct = ((overrideAvg - claudeAvg) / claudeAvg) * 100.0;
        }

        Integer bestHour = null;
        Integer bestDay = null;
        try {
            Object[] hourRow = postPlatformRepository.findBestHourForPlatform(projectId.toString(), platform);
            if (hourRow != null && hourRow.length > 0 && hourRow[0] != null)
                bestHour = ((Number) hourRow[0]).intValue();
        } catch (Exception ignored) {}
        try {
            Object[] dayRow = postPlatformRepository.findBestDayForPlatform(projectId.toString(), platform);
            if (dayRow != null && dayRow.length > 0 && dayRow[0] != null)
                bestDay = ((Number) dayRow[0]).intValue();
        } catch (Exception ignored) {}

        String bestHourLabel = bestHour != null ? formatHour(bestHour) : null;
        String bestDayLabel = bestDay != null ? formatDay(bestDay) : null;
        String confidenceLabel = hasEnoughData ? "📊 Based on your data" : "Learning...";
        String insightSummary = buildInsightSummary(hasEnoughData, improvementPct, bestHourLabel, bestDayLabel);

        return PerformanceInsightDto.builder()
            .platform(platform).totalPosts(total).hasEnoughData(hasEnoughData)
            .overrideAvgScore(overrideAvg).claudeAvgScore(claudeAvg)
            .overrideImprovementPct(improvementPct)
            .bestHour(bestHour).bestDayOfWeek(bestDay)
            .bestHourLabel(bestHourLabel).bestDayLabel(bestDayLabel)
            .confidenceLabel(confidenceLabel).insightSummary(insightSummary)
            .build();
    }

    public SmartScheduleTimingDto getSmartScheduleTiming(UUID projectId, List<String> platforms) {
        Map<String, SmartScheduleTimingDto.PlatformTiming> timings = new LinkedHashMap<>();
        boolean anyPersonalized = false;

        for (String platform : platforms) {
            int count = postPlatformRepository
                .countPublishedByProjectAndPlatform(projectId.toString(), platform);
            int[] def = DEFAULTS.getOrDefault(platform, new int[]{20, 3});

            if (count >= 10) {
                int hour = def[0], day = def[1];
                try {
                    Object[] hr = postPlatformRepository.findBestHourForPlatform(projectId.toString(), platform);
                    if (hr != null && hr.length > 0 && hr[0] != null) hour = ((Number)hr[0]).intValue();
                } catch (Exception ignored) {}
                try {
                    Object[] dr = postPlatformRepository.findBestDayForPlatform(projectId.toString(), platform);
                    if (dr != null && dr.length > 0 && dr[0] != null) day = ((Number)dr[0]).intValue();
                } catch (Exception ignored) {}
                timings.put(platform, SmartScheduleTimingDto.PlatformTiming.builder()
                    .hour(hour).dayOfWeek(day).personalized(true)
                    .label(formatDay(day) + " " + formatHour(hour) + " (your data)").build());
                anyPersonalized = true;
            } else {
                timings.put(platform, SmartScheduleTimingDto.PlatformTiming.builder()
                    .hour(def[0]).dayOfWeek(def[1]).personalized(false)
                    .label(formatDay(def[1]) + " " + formatHour(def[0]) + " (default)").build());
            }
        }

        return SmartScheduleTimingDto.builder()
            .usingPersonalizedData(anyPersonalized)
            .dataMessage(anyPersonalized ? "📊 Based on your data"
                : "Using defaults — post more to unlock personalized timing")
            .timings(timings).build();
    }

    public Map<String, Double> getSubredditScores(UUID projectId) {
        List<PostPlatform> rdPosts = postPlatformRepository
            .findPublishedRedditPostsWithScores(projectId.toString());
        Map<String, List<Double>> scoresBySubreddit = new HashMap<>();
        for (PostPlatform pp : rdPosts) {
            try {
                JsonNode extra = objectMapper.readTree(pp.getExtraData());
                String sub = extra.path("selectedSubreddit").asText(null);
                if (sub != null && !sub.isBlank()) {
                    scoresBySubreddit.computeIfAbsent(sub, k -> new ArrayList<>())
                        .add(pp.getPerformanceScore().doubleValue());
                }
            } catch (Exception ignored) {}
        }
        Map<String, Double> avgScores = new LinkedHashMap<>();
        scoresBySubreddit.forEach((sub, scores) ->
            avgScores.put(sub, scores.stream().mapToDouble(Double::doubleValue).average().orElse(0)));
        return avgScores;
    }

    private Double averageScore(List<PostPlatform> posts) {
        if (posts.isEmpty()) return null;
        return posts.stream()
            .filter(p -> p.getPerformanceScore() != null)
            .mapToDouble(p -> p.getPerformanceScore().doubleValue())
            .average().orElse(Double.NaN);
    }

    private String formatHour(int hour) {
        if (hour == 0) return "12am";
        if (hour < 12) return hour + "am";
        if (hour == 12) return "12pm";
        return (hour - 12) + "pm";
    }

    private String formatDay(int dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> "Monday"; case 2 -> "Tuesday"; case 3 -> "Wednesday";
            case 4 -> "Thursday"; case 5 -> "Friday"; case 6 -> "Saturday";
            case 7 -> "Sunday"; default -> "Unknown";
        };
    }

    private String buildInsightSummary(boolean hasEnoughData, Double pct,
                                        String hourLabel, String dayLabel) {
        if (!hasEnoughData) return "Still learning — post more to unlock insights";
        StringBuilder sb = new StringBuilder();
        if (pct != null) {
            if (pct > 5) sb.append(String.format("Your edits outperform Claude by %.0f%%", pct));
            else if (pct < -5) sb.append(String.format("Claude suggestions %.0f%% better than your edits", Math.abs(pct)));
            else sb.append("Claude suggestions and your edits performing similarly");
        }
        if (hourLabel != null && dayLabel != null) {
            if (sb.length() > 0) sb.append(". ");
            sb.append("Best: ").append(dayLabel).append(" ").append(hourLabel);
        }
        return sb.toString();
    }
}
