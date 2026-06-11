package com.haruon.groupware.application.board.service.dto.response;

import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;

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

    public BoardSummaryResponse applyDirtyReactionCounters(
            BoardReactionDelta delta
    ) {
        return new BoardSummaryResponse(
                this.boardId,
                this.boardTitle,
                this.authorName,
                this.publishedAt,
                applyCount(this.viewCount, delta.viewCount()),
                applyCount(this.likeCount, delta.likeCount()),
                applyCount(this.commentCount, delta.commentCount()),
                this.isFileAttached
        );
    }

    private Long applyCount(Long base, Long delta) {
        long baseLong = base == null ? 0 : base;
        long deltaLong = delta == null ? 0 : delta;

        return baseLong + deltaLong;
    }


}
