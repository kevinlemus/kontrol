package com.kontrol.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScheduleRequest {
    private String postId;
    private List<PlatformScheduleItem> platforms;

    @Data
    public static class PlatformScheduleItem {
        private String platformId;
        private String scheduledAt; // ISO string
    }
}
