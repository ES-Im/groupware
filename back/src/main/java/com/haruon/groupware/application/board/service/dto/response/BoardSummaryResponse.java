package com.haruon.groupware.application.board.service.dto.response;

import java.time.LocalDateTime;

public record BoardSummaryResponse(
        Long boardId,
        String boardTitle,
        String authorName,
        LocalDateTime publishedAt,
        Long viewCount,
        Long likeCount,
        Long commentCount,
        Boolean isFileAttached
) {
}
