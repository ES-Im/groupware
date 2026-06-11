package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;

import java.util.List;
import java.util.Map;

/**
 * DB반영 이전 임시로 게시글 조회수/좋아요/댓글수를 Redis에 카운트하는 required port
 */
public interface BoardReactionCounter {

    void increaseViewCount(Long boardId);

    void increaseLikeCount(Long boardId);

    void decreaseLikeCount(Long boardId);

    void increaseCommentCount(Long boardId);

    void decreaseCommentCount(Long boardId);

    BoardReactionDelta findDelta(Long boardId);

    Map<Long, BoardReactionDelta> findDeltas(List<Long> boardIds);

    void clearDelta(Long boardId);
}

//todo
// 배치 처리 대상 : BoardRedis.markBoardAsDirtyById(boardId)
// -> redis set 구조로 dirty boardId를 표시한 것 -> board 엔티티에 일괄 반영 적용
