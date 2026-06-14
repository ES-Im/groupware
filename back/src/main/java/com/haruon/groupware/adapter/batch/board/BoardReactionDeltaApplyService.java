package com.haruon.groupware.adapter.batch.board;

import com.haruon.groupware.application.board.provided.BoardReactionCounter;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

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
    public long applyDirtyReactionToBoard() {
        long appliedReaction = 0;
        List<Long> dirtyBoardIds = boardReactionCounter.findDirtyBoardIds();

        for (Long boardId : dirtyBoardIds) {
            BoardReactionDelta delta = boardReactionCounter.findDelta(boardId);
            if(isReactionEmpty(delta)) {
                clearRedisAfterEmptyDelta(boardId);
                continue;
            }

            int isApplied = boardReactionDeltaDbApplyService.applyReactionDeltaToBoard(boardId, delta);

            if(isApplied == 1) {
                clearRedisAfterCommittedDbApply(boardId, delta);
                appliedReaction++;
            } else if(!boardRepository.existsBoardById(boardId)) {
                log.warn("orphan redis delta. redis만 정리. boardId = {}, delta = {}", boardId, delta);
                clearRedisAfterOrphanDetected(boardId, delta);
            } else {
                log.warn("board reaction delta DB apply 실패. [확인 필요] boardId = {}, delta = {}", boardId, delta);
            }

        }

        return appliedReaction;
    }

    private boolean isReactionEmpty(BoardReactionDelta delta) {
        return delta.viewCount() == 0
                && delta.likeCount() == 0
                && delta.commentCount() == 0;
    }

    private void clearRedisAfterCommittedDbApply(Long boardId, BoardReactionDelta delta) {
        boolean cleared = boardReactionCounter.clearDeltaHashAndDirtySet(boardId);

        if(!cleared) {
            log.error("DB 커밋 이후, Redis clear 실패. [익일 중복 DB apply 방지를 위한 확인 필요] boardId = {}, delta = {}", boardId, delta);
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
            log.error("orphan delta 대상 Redis clear 실패. [확인 필요] boardId = {}, delta = {}", boardId, delta);
        }
    }
}
