package com.haruon.groupware.adapter.batch.board;

import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.service.dto.BoardReactionDelta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class BoardReactionDeltaDbApplyService {

    private final BoardRepository boardRepository;

    // Step/서비스 흐름의 큰 트랜잭션과 분리해 DB update를 먼저 커밋한 뒤 Redis clear를 수행하기 위해 별도 Bean + REQUIRES_NEW를 사용한다.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int applyReactionDeltaToBoard(Long boardId, BoardReactionDelta delta) {
        return boardRepository.updateReactionDeltaToBoard(
                boardId,
                delta.viewCount(),
                delta.commentCount(),
                delta.likeCount()
        );
    }

}
