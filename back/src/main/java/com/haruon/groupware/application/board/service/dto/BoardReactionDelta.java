package com.haruon.groupware.application.board.service.dto;

public record BoardReactionDelta(
        Long viewCount,
        Long likeCount,
        Long commentCount
) {
}
