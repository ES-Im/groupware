package com.haruon.groupware.application.board.service.dto.response;

/**
 * 게시글 편집용 Response DTO
 */
public record BoardDetailForEditResponse(
        Long boardId,
        Long categoryId,
        String title,
        String content
) {
}
