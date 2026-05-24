package com.kontrol.dto;

import lombok.Data;

@Data
public class PostCommentRequest {
    private String suggestionId;
    private String commentText; // optional override
}
