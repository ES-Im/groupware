package com.haruon.groupware.application.board.service.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

public record BoardCommentResponse(
        @Nullable Long parentCommentId,
        Long commentId,
        Long writerEmpId,
        String writerEmpName,
        String content,
        LocalDateTime registerAt,
        Boolean isEdited,
        Boolean isDeleted
) {
    public BoardCommentResponse {
        if (isDeleted) {
            writerEmpId = null;
            writerEmpName = null;
            content = null;
            registerAt = null;
            isEdited = null;
        }
    }
}
