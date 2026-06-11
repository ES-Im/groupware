package com.haruon.groupware.adapter.redis;

import com.haruon.groupware.application.board.provided.BoardReactionCounter;
import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoardRedis implements BoardReactionCounter {

    private static final String REACTION_DELTA_PREFIX = "board:reaction:delta:";    // {boardId}
    private static final String REACTION_DIRTY_PREFIX = "board:reaction:dirty";

    private final StringRedisTemplate redisTemplate;

    @Override
    public void increaseViewCount(Long boardId) {
        incrementFieldInHash(boardId, "viewCount");

        markBoardAsDirtyById(boardId);
    }

    @Override
    public void increaseLikeCount(Long boardId) {
        incrementFieldInHash(boardId, "likeCount");

        markBoardAsDirtyById(boardId);
    }

    @Override
    public void decreaseLikeCount(Long boardId) {
        decrementFieldInHash(boardId, "likeCount");

        markBoardAsDirtyById(boardId);
    }

    @Override
    public void increaseCommentCount(Long boardId) {
        incrementFieldInHash(boardId, "commentCount");

        markBoardAsDirtyById(boardId);
    }

    @Override
    public void decreaseCommentCount(Long boardId) {
        decrementFieldInHash(boardId, "commentCount");

        markBoardAsDirtyById(boardId);
    }

    @Override
    public BoardReactionDelta findDelta(Long boardId) {
        return new BoardReactionDelta(
                getDeltaAndParseLong(boardId, "viewCount"),
                getDeltaAndParseLong(boardId, "likeCount"),
                getDeltaAndParseLong(boardId, "commentCount")
        );
    }


    @Override
    public Map<Long, BoardReactionDelta> findDeltas(List<Long> boardIds) {
        Map<Long, BoardReactionDelta> deltaMap = new HashMap<>();

        for (Long id : boardIds) {
            deltaMap.put(id, findDelta(id));
        }

        return deltaMap;
    }

    //todo  - 배치 처리시, 한 step마다 실행
    @Override
    public void clearDelta(Long boardId) {
        redisTemplate.delete(REACTION_DELTA_PREFIX + boardId);

        redisTemplate.opsForSet()
                .remove(REACTION_DIRTY_PREFIX, String.valueOf(boardId));
    }

    private Long getDeltaAndParseLong(Long boardId, String field) {
        Object delta = redisTemplate.opsForHash()
                .get(REACTION_DELTA_PREFIX + boardId, field);

        if(delta == null) return 0L;
        return Long.parseLong(delta.toString());
    }

    private void incrementFieldInHash(Long boardId, String commentCount) {
        redisTemplate.opsForHash()
                .increment(REACTION_DELTA_PREFIX + boardId, commentCount, 1);
    }

    private void decrementFieldInHash(Long boardId, String commentCount) {
        redisTemplate.opsForHash()
                .increment(REACTION_DELTA_PREFIX + boardId, commentCount, -1);
    }

    private void markBoardAsDirtyById(Long boardId) {
        //todo - 배치에서는 이 Set의 boardId 목록을 읽어서 delta Hash를 DB에 일괄 반영하도록 구현
        redisTemplate.opsForSet()
                .add(REACTION_DIRTY_PREFIX, String.valueOf(boardId));
    }
}
