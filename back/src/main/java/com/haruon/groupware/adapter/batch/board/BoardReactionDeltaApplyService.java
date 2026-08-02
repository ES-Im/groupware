package com.haruon.groupware.adapter.batch.board;

import com.haruon.groupware.adapter.exception.batch.BatchJobFailedException;
import com.haruon.groupware.application.board.provided.forCommand.BoardReactionCounter;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.service.command.dto.BoardReactionDelta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class BoardReactionDeltaApplyService {

    private final BoardReactionCounter boardReactionCounter;
    private final BoardRepository boardRepository;
    private final BoardReactionDeltaDbApplyService boardReactionDeltaDbApplyService;

    public long countRemainingDirtyReactions() {
        return boardReactionCounter.countDirtyBoardIds();
    }


    /*
     * delta(Hash) + dirty(Set)을 일정 스케줄(배치 처리)에 따라 DB 반영 후 Redis 정리
     * 1. delta 조회
     * 2. 별도의 Bean 트랜잭션(REQUIRES_NEW)에서 DB에 delta 반영 및 커밋
     * 3. Redis clearDelta Lua script 실행
     * => Redis 정리 실패가 이미 커밋된 DB 반영을 롤백하지 못하므로, 실패를 감지해 로그로 남긴다.
     */
    public Map<String, Long> applyDirtyReactionToBoard() {
        Map<String, Long> result = new HashMap<>(Map.of(
                "applied", 0L,
                "failed", 0L
        ));

        List<Long> dirtyBoardIds = boardReactionCounter.findDirtyBoardIds();

        for (Long boardId : dirtyBoardIds) {
            BoardReactionDelta delta = boardReactionCounter.findDelta(boardId);
            if(isReactionEmpty(delta)) {
                clearRedisAfterEmptyDelta(boardId);
                continue;
            }

            int isApplied = boardReactionDeltaDbApplyService.applyReactionDeltaToBoard(boardId, delta);

            if(isApplied == 1) {

                try {
                    clearRedisAfterCommittedDbApply(boardId, delta);
                } finally {
                    result.put("applied", (result.getOrDefault("applied", 0L) + 1));
                }

            } else if(!boardRepository.existsBoardById(boardId)) {

                try {
                    clearRedisAfterOrphanDetected(boardId, delta);
                } finally {
                    log.warn("orphan redis delta. redis만 정리시도. boardId = {}, delta = {}", boardId, delta);
                }

            } else {
                result.put("failed", (result.getOrDefault("failed", 0L) + 1));
                log.warn("board reaction delta DB apply 실패. [확인 필요] boardId = {}, delta = {}", boardId, delta);
            }
        }

        return result;
    }

    private boolean isReactionEmpty(BoardReactionDelta delta) {
        return delta.viewCount() == 0
                && delta.likeCount() == 0
                && delta.commentCount() == 0;
    }

    private void clearRedisAfterCommittedDbApply(Long boardId, BoardReactionDelta delta) {
        boolean cleared = boardReactionCounter.clearDeltaHashAndDirtySet(boardId);

        if(!cleared) {
            String detail = String.format(
                    "%s job batch 실패 : " +
                        "DB 커밋 이후, Redis clear 실패. " +
                        "[익일 중복 DB apply 방지를 위한 확인 필요] boardId = %d, delta = %s",
                    "boardReactionApplyStep", boardId, delta
            );

            throw new BatchJobFailedException(detail);
        }
    }

    private void clearRedisAfterEmptyDelta(Long boardId) {
        boolean cleared = boardReactionCounter.clearDeltaHashAndDirtySet(boardId);

        if(!cleared) {
            log.error("Redis clear failed for empty delta. boardId = {}", boardId);
        }
    }

    private void clearRedisAfterOrphanDetected(Long boardId, BoardReactionDelta delta) {
        boolean cleared = boardReactionCounter.clearDeltaHashAndDirtySet(boardId);

        if(!cleared) {
            String detail = String.format(
                    "%s job batch 실패 : " +
                            "orphan delta 대상 Redis clear 실패." +
                            "[확인 필요] boardId = %d, delta = %s",
                    "boardReactionApplyStep", boardId, delta
            );

            throw new BatchJobFailedException(detail);

        }
    }
}
