package com.kontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsAlertDto {
    /** high_performer | posting_gap | best_time */
    private String type;
    private String message;
    /** UUID of the relevant post — may be null */
    private String postId;
    /** boost | compose | schedule */
    private String action;
    /** high | medium | low */
    private String urgency;
}
