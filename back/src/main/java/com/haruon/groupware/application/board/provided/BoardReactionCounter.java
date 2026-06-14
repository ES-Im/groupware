package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;

import java.util.List;
import java.util.Map;

/**
 * DB반영 이전 임시로 게시글 조회수/좋아요/댓글수를 Redis에 카운트하고 batch 때 DB에 적용하는 required port
 */
public interface BoardReactionCounter {

    void increaseViewCount(Long boardId);

    void increaseLikeCount(Long boardId);

    void decreaseLikeCount(Long boardId);

    void increaseCommentCount(Long boardId);

    void decreaseCommentCount(Long boardId);

    BoardReactionDelta findDelta(Long boardId);

    Map<Long, BoardReactionDelta> findDeltas(List<Long> boardIds);

    List<Long> findDirtyBoardIds();

    long countDirtyBoardIds();

    /**
     * DB 반영이 확정된 boardId의 Redis delta/dirty 정보를 정리한다.
     * Redis 정리 실패 시 같은 delta가 다음 배치에서 재반영될 수 있으므로 호출자가 성공 여부를 확인한다.
     */
    boolean clearDeltaHashAndDirtySet(Long boardId);
}
