package com.haruon.groupware.application.board.service.query.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

public record BoardDraftsResponse(
        Long boardId,
        String title,
        LocalDateTime updatedAt
) {

    public BoardDraftsResponse(Long boardId, String title, Instant updatedAt) {
        this(
                boardId,
                title,
                LocalDateTime.ofInstant(
                        updatedAt,
                        ZoneId.of("Asia/Seoul")
                )
        );

    }
}
