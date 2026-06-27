package com.haruon.groupware.application.board.service.query;

import com.haruon.groupware.application.board.provided.forCommand.BoardReactionCounter;
import com.haruon.groupware.application.board.provided.forRetriever.BoardAndCommentRetriever;
import com.haruon.groupware.application.board.required.BoardQueryRepository;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.service.command.dto.BoardReactionDelta;
import com.haruon.groupware.application.board.service.query.dto.*;
import com.haruon.groupware.application.exception.board.BoardNotFoundException;
import com.haruon.groupware.application.exception.board.EmpNotMatchAuthorException;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BoardAndCommentQueryService implements BoardAndCommentRetriever {

    private final BoardQueryRepository boardQueryRepository;
    private final BoardRepository boardRepository;
    private final BoardReactionCounter boardReactionCounter;

    @Override
    public Page<BoardSummaryResponse> retrieveBoardSummaries(
            Long categoryId, @Nullable String boardTitleKeyword, Pageable pageable
    ) {
        Page<BoardSummaryResponse> pageResponse = boardQueryRepository.findBoardsByCategoryId(
                categoryId, boardTitleKeyword, pageable
        );

        List<Long> boardIds = pageResponse.stream()
                .map(BoardSummaryResponse::boardId).toList();

        Map<Long, BoardReactionDelta> deltas = boardReactionCounter.findDeltas(boardIds);

        return pageResponse.map(res -> {
            BoardReactionDelta delta = deltas.getOrDefault(
                    res.boardId(),
                    new BoardReactionDelta(0L, 0L, 0L)
            );

            return res.applyDirtyReactionCounters(delta);
        });

    }

    @Override
    public List<LatestBoardSummaryResponse> retrieveLatestBoards(
            Long categoryId, Long limit
    ) {
        return boardQueryRepository.findLatestBoardsByCategoryId(categoryId, limit);
    }

    @Override
    public BoardDetailResponse retrieveBoardDetail(Long boardId) {
        BoardDetailResponse board = boardQueryRepository.findBoardByIdAndIsDraftFalse(boardId);
        if(board == null) throw new BoardNotFoundException();

        boardReactionCounter.increaseViewCount(boardId);
        BoardReactionDelta delta = boardReactionCounter.findDelta(boardId);

        return board.applyDirtyReactionCounters(delta);
    }

    @Override
    public Page<BoardCommentResponse> retrieveBoardComments(Long boardId, Pageable pageable) {
        return boardQueryRepository.findCommentsByBoardId(boardId, pageable);
    }

    @Override
    public List<FileListInfo> retrieveBoardFiles(Long boardId) {
        return boardQueryRepository.findBoardFilesByBoardId(boardId);
    }

    @Override
    public BoardDetailForEditResponse retrieveMyBoardDetail(Long authorId, Long boardId) {
        BoardDetailForEditResponse response = boardQueryRepository.findBoardByIdAndEmpId(boardId, authorId);

        if(response == null) {
            boolean existsBoardById = boardRepository.existsBoardById(boardId);
            if(!existsBoardById) throw new BoardNotFoundException();

            throw new EmpNotMatchAuthorException();
        }

        return response;
    }

    @Override
    public List<BoardDraftsResponse> retrieveMyBoardDrafts(Long authorEmpId) {
        return boardQueryRepository.findBoardByAuthorIdAndIsDraftTrue(authorEmpId);
    }
}
