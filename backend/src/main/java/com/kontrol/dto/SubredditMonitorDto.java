package com.kontrol.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubredditMonitorDto {
    private String id;
    private String subreddit;
    private boolean active;
    private OffsetDateTime lastCheckedAt;
    private OffsetDateTime lastPostedAt;
    private Integer engagementScore;
    private boolean coolingDown;       // true if lastPostedAt within 48h
    private Long hoursUntilEligible;   // how many hours until cooldown ends (0 if eligible)
}
