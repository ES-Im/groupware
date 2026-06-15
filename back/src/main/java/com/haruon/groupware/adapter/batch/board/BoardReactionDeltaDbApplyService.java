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
