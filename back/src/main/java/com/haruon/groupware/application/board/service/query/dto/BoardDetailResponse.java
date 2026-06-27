package com.haruon.groupware.application.board.service.query.dto;

import com.haruon.groupware.application.board.service.command.dto.BoardReactionDelta;

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

    public BoardDetailResponse applyDirtyReactionCounters(
            BoardReactionDelta delta
    ) {
        return new BoardDetailResponse(
                this.boardId,
                this.categoryId,
                this.empId,
                this.authorName,
                this.title,
                this.content,
                this.publishedAt,
                this.modifiedAt,
                applyCount(this.likeCount, delta.likeCount()),
                applyCount(this.viewCount, delta.viewCount()),
                applyCount(this.commentCount, delta.commentCount()),
                this.isDraft
        );
    }

    private Long applyCount(Long base, Long delta) {
        long baseLong = base == null ? 0 : base;
        long deltaLong = delta == null ? 0 : delta;

        return baseLong + deltaLong;
    }
}


