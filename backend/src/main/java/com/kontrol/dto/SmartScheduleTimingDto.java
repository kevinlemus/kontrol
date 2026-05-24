package com.kontrol.dto;

import lombok.*;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SmartScheduleTimingDto {
    private boolean usingPersonalizedData;
    private String dataMessage;
    private Map<String, PlatformTiming> timings;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PlatformTiming {
        private int hour;
        private int dayOfWeek;
        private boolean personalized;
        private String label;
    }
}
