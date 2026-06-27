package com.haruon.groupware.application.board.service.command.dto;

public record BoardReactionDelta(
        Long viewCount,
        Long likeCount,
        Long commentCount
) {
}
