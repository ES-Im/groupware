package com.haruon.groupware.adapter.redis.board;

import com.haruon.groupware.application.board.provided.BoardReactionCounter;
import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoardRedis implements BoardReactionCounter {

    private static final String REACTION_DELTA_PREFIX = "board:reaction:delta:";    // {boardId}
    private static final String REACTION_DIRTY_PREFIX = "board:reaction:dirty";
    private static final String VIEW_COUNT = "viewCount";
    private static final String LIKE_COUNT = "likeCount";
    private static final String COMMENT_COUNT = "commentCount";

    private final StringRedisTemplate redisTemplate;

    /**
     * 게시글 별
     * 1. 조회수 / 댓글수 / 좋아요 수를 Hash 구조로 HINCRBY
     * 2. DB 반영 때 참고할 boardId를 Set 구조로 SADD
     */
    private static final DefaultRedisScript<Long> EXEC_UPDATE_DELTA_AND_DIRTY_SCRIPT = new DefaultRedisScript<>("""
            local deltaType = redis.call('TYPE', KEYS[1]).ok
            local dirtyType = redis.call('TYPE', KEYS[2]).ok

            if deltaType ~= 'none' and deltaType ~= 'hash' then return redis.error_reply('delta key destinationType is not hash') end
            if dirtyType ~= 'none' and dirtyType ~= 'set' then return redis.error_reply('dirty key destinationType is not set') end

            redis.call('HINCRBY', KEYS[1], ARGV[1], ARGV[2])
            redis.call('SADD', KEYS[2], ARGV[3])

            return 1
            """, Long.class);

    private void execUpdatingDeltaAndDirtyInRedis(Long boardId, String field, long amount) {
        Long execute = redisTemplate.execute(
                EXEC_UPDATE_DELTA_AND_DIRTY_SCRIPT,
                List.of(
                        REACTION_DELTA_PREFIX + boardId,    // key[1]
                        REACTION_DIRTY_PREFIX               // key[2]
                ),
                field,                                      // argv[1]
                String.valueOf(amount),                     // argv[2]
                String.valueOf(boardId)                     // argv[3]
        );

        if(!Long.valueOf(1L).equals(execute)) log.error("redis dirty/delta update failed. boardId = {}, field = {}", boardId, field);
    }

    @Override
    public void increaseViewCount(Long boardId) {
        execUpdatingDeltaAndDirtyInRedis(boardId, VIEW_COUNT, 1);
    }

    @Override
    public void increaseLikeCount(Long boardId) {
        execUpdatingDeltaAndDirtyInRedis(boardId, LIKE_COUNT, 1);
    }

    @Override
    public void decreaseLikeCount(Long boardId) {
        execUpdatingDeltaAndDirtyInRedis(boardId, LIKE_COUNT, -1);
    }

    @Override
    public void increaseCommentCount(Long boardId) {
        execUpdatingDeltaAndDirtyInRedis(boardId, COMMENT_COUNT, 1);
    }

    @Override
    public void decreaseCommentCount(Long boardId) {
        execUpdatingDeltaAndDirtyInRedis(boardId, COMMENT_COUNT, -1);
    }


    /**
     * DB(Board Table)와 redis Hash - deltaMap에서 임시 delta 들 반영하여 조회수 / 좋아요 수 / 댓글 수 최신걸로 반환
     */
    private Long getDeltaAndParseLong(Long boardId, String field) {
        Object delta = redisTemplate.opsForHash()
                .get(REACTION_DELTA_PREFIX + boardId, field);

        if(delta == null) return 0L;
        return Long.parseLong(delta.toString());
    }

    @Override
    public BoardReactionDelta findDelta(Long boardId) {
        return new BoardReactionDelta(
                getDeltaAndParseLong(boardId, VIEW_COUNT),
                getDeltaAndParseLong(boardId, LIKE_COUNT),
                getDeltaAndParseLong(boardId, COMMENT_COUNT)
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

    @Override
    public List<Long> findDirtyBoardIds() {
        Set<String> members = redisTemplate.opsForSet()
                .members(REACTION_DIRTY_PREFIX);

        if(members == null) return List.of();

        return members.stream()
                .map(Long::parseLong)
                .toList();
    }

    @Override
    public long countDirtyBoardIds() {
        Long size = redisTemplate.opsForSet()
                .size(REACTION_DIRTY_PREFIX);

        return size == null ? 0 : size;
    }

    /**
     * 배치작업 시, DB에 커밋된 boardId 기준 redis 메모리 정리
     */
    private static final DefaultRedisScript<Long> CLEAR_DELTA_AND_DIRTY_SCRIPT
            = new DefaultRedisScript<>("""
                redis.call('DEL', KEYS[1])
                redis.call('SREM', KEYS[2], ARGV[1])

                return 1
                """, Long.class
    );
    @Override
    public boolean clearDeltaHashAndDirtySet(Long boardId) {
        try {
            Long execute = redisTemplate.execute(
                    CLEAR_DELTA_AND_DIRTY_SCRIPT,
                    List.of(
                            REACTION_DELTA_PREFIX + boardId,
                            REACTION_DIRTY_PREFIX
                    ),
                    String.valueOf(boardId)
            );

            boolean cleared = Long.valueOf(1L).equals(execute);
            if(!cleared) log.error("redis clearDeltaHashAndDirtySet 삭제 실패. boardId = {}, result = {}", boardId, execute);

            return cleared;
        } catch (RuntimeException ex) {
            log.error("redis clearDeltaHashAndDirtySet 예외 발생. boardId = {}", boardId, ex);
            return false;
        }
    }

}
