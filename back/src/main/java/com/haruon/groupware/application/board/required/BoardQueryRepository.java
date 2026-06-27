package com.haruon.groupware.application.board.required;

import com.haruon.groupware.application.board.service.query.dto.*;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BoardQueryRepository {

    Page<BoardSummaryResponse> findBoardsByCategoryId(
            Long categoryId, @Nullable String boardTitleKeyword, Pageable pageable
    );

    List<LatestBoardSummaryResponse> findLatestBoardsByCategoryId(
            Long categoryId, Long limit
    );

    BoardDetailResponse findBoardByIdAndIsDraftFalse(Long boardId);

    Page<BoardCommentResponse> findCommentsByBoardId(Long boardId, Pageable pageable);

    List<FileListInfo> findBoardFilesByBoardId(Long boardId);

    Boolean existsBoardByIdAndEmpId(Long boardId, Long authorEmpId);

    BoardDetailForEditResponse findBoardByIdAndEmpId(Long boardId, Long authorEmpId);

    List<BoardDraftsResponse> findBoardByAuthorIdAndIsDraftTrue(Long authorEmpId);
}
