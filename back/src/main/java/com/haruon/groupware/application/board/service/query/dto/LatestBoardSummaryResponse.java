package com.haruon.groupware.application.board.service.query.dto;

import java.time.LocalDateTime;

public record LatestBoardSummaryResponse (
        Long boardId,
        String title,
        String authorName,
        LocalDateTime publishedAt
) {
}
