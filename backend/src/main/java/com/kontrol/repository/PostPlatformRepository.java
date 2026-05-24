package com.kontrol.repository;

import com.kontrol.model.PostPlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
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
}
