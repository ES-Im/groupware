package com.haruon.groupware.application.board.provided.forRetriever;

import com.haruon.groupware.application.board.service.query.dto.*;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BoardAndCommentRetriever {

    Page<BoardSummaryResponse> retrieveBoardSummaries(
            Long categoryId,
            @Nullable String boardTitleKeyword,
            Pageable pageable
    );

    List<LatestBoardSummaryResponse> retrieveLatestBoards (
            Long categoryId,
            Long limit
    );

    BoardDetailResponse retrieveBoardDetail(
            Long boardId
    );

    Page<BoardCommentResponse> retrieveBoardComments(
            Long boardId, Pageable pageable
    );

    List<FileListInfo> retrieveBoardFiles(
            Long boardId
    );

    BoardDetailForEditResponse retrieveMyBoardDetail(
            Long authorId, Long boardId
    );

    List<BoardDraftsResponse> retrieveMyBoardDrafts(Long authorEmpId);
}
