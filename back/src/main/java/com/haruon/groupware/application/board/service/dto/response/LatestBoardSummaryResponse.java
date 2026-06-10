package com.haruon.groupware.application.board.service.dto.response;

import java.time.LocalDateTime;

public record LatestBoardSummaryResponse (
        Long boardId,
        String title,
        String authorName,
        LocalDateTime publishedAt
) {
}
