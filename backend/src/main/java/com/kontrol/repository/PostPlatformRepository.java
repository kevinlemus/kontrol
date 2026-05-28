package com.kontrol.repository;

import com.kontrol.model.PostPlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostPlatformRepository extends JpaRepository<PostPlatform, UUID> {

    List<PostPlatform> findByPostId(UUID postId);

    List<PostPlatform> findByPostIdAndStatus(UUID postId, String status);

    @Query("SELECT pp FROM PostPlatform pp WHERE pp.status = 'published' AND pp.publishedAt <= :cutoff AND pp.performanceCheckedAt IS NULL")
    List<PostPlatform> findDueForPerformanceCheck(@Param("cutoff") OffsetDateTime cutoff);

    @Query(value = "SELECT pp.* FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform AND pp.status = 'published' ORDER BY pp.published_at DESC LIMIT 30", nativeQuery = true)
    List<PostPlatform> findTop30PublishedByProjectAndPlatform(@Param("projectId") String projectId, @Param("platform") String platform);

    @Query(value = "SELECT pp.posted_hour FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform AND pp.performance_score > 0 AND pp.posted_hour IS NOT NULL GROUP BY pp.posted_hour ORDER BY AVG(pp.performance_score) DESC LIMIT 1", nativeQuery = true)
    Object[] findBestHourForPlatform(@Param("projectId") String projectId, @Param("platform") String platform);

    @Query(value = "SELECT pp.posted_day_of_week FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform AND pp.performance_score > 0 AND pp.posted_day_of_week IS NOT NULL GROUP BY pp.posted_day_of_week ORDER BY AVG(pp.performance_score) DESC LIMIT 1", nativeQuery = true)
    Object[] findBestDayForPlatform(@Param("projectId") String projectId, @Param("platform") String platform);

    @Query(value = "SELECT COUNT(*) FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform AND pp.status = 'published'", nativeQuery = true)
    int countPublishedByProjectAndPlatform(@Param("projectId") String projectId, @Param("platform") String platform);

    @Query(value = "SELECT pp.* FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = 'RD' AND pp.status = 'published' AND pp.extra_data IS NOT NULL AND pp.performance_score > 0", nativeQuery = true)
    List<PostPlatform> findPublishedRedditPostsWithScores(@Param("projectId") String projectId);

    @Query(value = "SELECT pp.* FROM post_platforms pp " +
                   "JOIN posts p ON pp.post_id = p.id " +
                   "WHERE p.project_id = CAST(:projectId AS uuid) " +
                   "AND pp.platform = :platform " +
                   "AND pp.was_overridden = true " +
                   "AND pp.original_content IS NOT NULL " +
                   "AND pp.content IS NOT NULL " +
                   "ORDER BY pp.published_at DESC NULLS LAST, pp.created_at DESC " +
                   "LIMIT :limit", nativeQuery = true)
    List<PostPlatform> findRecentEditsForProjectAndPlatform(
        @Param("projectId") String projectId,
        @Param("platform") String platform,
        @Param("limit") int limit);

    // Analytics queries
    @Query(value = "SELECT COUNT(*) FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.status = 'published'", nativeQuery = true)
    int countAllPublishedByProject(@Param("projectId") String projectId);

    @Query(value = "SELECT pp.platform, COUNT(*) as cnt FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.status = 'published' GROUP BY pp.platform ORDER BY cnt DESC LIMIT 1", nativeQuery = true)
    Object[] findBestPlatformByProject(@Param("projectId") String projectId);

    @Query(value = "SELECT pp.post_type, COUNT(*) as cnt FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.status = 'published' AND pp.post_type IS NOT NULL GROUP BY pp.post_type ORDER BY cnt DESC LIMIT 1", nativeQuery = true)
    Object[] findBestPostTypeByProject(@Param("projectId") String projectId);

    @Query(value = "SELECT COUNT(*) FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.status = 'published' AND pp.published_at >= :since", nativeQuery = true)
    int countPublishedByProjectSince(@Param("projectId") String projectId, @Param("since") OffsetDateTime since);

    @Query(value = "SELECT pp.* FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) ORDER BY pp.performance_score DESC NULLS LAST, pp.created_at DESC LIMIT :limit", nativeQuery = true)
    List<PostPlatform> findByProjectOrderByPerformance(@Param("projectId") String projectId, @Param("limit") int limit);

    @Query(value = "SELECT pp.* FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform ORDER BY pp.performance_score DESC NULLS LAST, pp.created_at DESC LIMIT :limit", nativeQuery = true)
    List<PostPlatform> findByProjectAndPlatformOrderByPerformance(@Param("projectId") String projectId, @Param("platform") String platform, @Param("limit") int limit);

    @Query(value = "SELECT pp.* FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform ORDER BY pp.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<PostPlatform> findMostRecentByProjectAndPlatform(@Param("projectId") String projectId, @Param("platform") String platform);

    @Query(value = "SELECT pp.status, COUNT(*) FROM post_platforms pp JOIN posts p ON pp.post_id = p.id WHERE p.project_id = CAST(:projectId AS uuid) AND pp.platform = :platform GROUP BY pp.status", nativeQuery = true)
    List<Object[]> countStatusBreakdownByProjectAndPlatform(@Param("projectId") String projectId, @Param("platform") String platform);
}
