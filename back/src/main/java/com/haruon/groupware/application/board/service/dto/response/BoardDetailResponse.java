package com.haruon.groupware.application.board.service.dto.response;

import java.time.LocalDateTime;

/**
 * 게시글 상세보기 RESPONSE DTO
 */
public record BoardDetailResponse(
        Long boardId,
        Long categoryId,
        Long empId,
        String authorName,
        String title,
        String content,
        LocalDateTime publishedAt,
        LocalDateTime modifiedAt,
        Long likeCount,
        Long viewCount,
        Long commentCount,
        Boolean isDraft
) {
}


