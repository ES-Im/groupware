package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.board.provided.forRetriever.BoardAndCommentRetriever;
import com.haruon.groupware.application.board.service.query.dto.*;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class BoardQueryApi {

    private final BoardAndCommentRetriever boardAndCommentRetriever;

    // 목록 조회 - 카테고리 별
    @GetMapping("/categories/{categoryId}/boards")
    public ResponseEntity<Page<BoardSummaryResponse>> getBoardsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<BoardSummaryResponse> responses = boardAndCommentRetriever.retrieveBoardSummaries(
                categoryId, keyword, pageable
        );

        return ResponseEntity.ok().body(responses);
    }
    
    // 홈 카테고리 별 최신 5개 게시글 추출
    @GetMapping("/categories/{categoryId}/boards/latest")
    public ResponseEntity<List<LatestBoardSummaryResponse>> getLatestBoardsByCategory (
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "5") Long limit
    ) {
        List<LatestBoardSummaryResponse> responses = boardAndCommentRetriever.retrieveLatestBoards(categoryId, limit);

        return ResponseEntity.ok().body(responses);
    }

    /**
     * 게시글 상세 조회 -> boardDetail, boardComments, boardFiles 한페이지에 조회되어야함
     */
    // 게시글 상세 조회
    @GetMapping("/boards/{boardId}")
    public ResponseEntity<BoardDetailResponse> getBoardDetail(
            @PathVariable Long boardId
    ) {
        BoardDetailResponse response = boardAndCommentRetriever.retrieveBoardDetail(boardId);

        return ResponseEntity.ok().body(response);
    }

    // 게시글ㄹ에 딸린 댓글 페이징
    @GetMapping("/boards/{boardId}/comments")
    public ResponseEntity<Page<BoardCommentResponse>> getBoardComments(
            @PathVariable Long boardId,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<BoardCommentResponse> responses = boardAndCommentRetriever.retrieveBoardComments(boardId, pageable);

        return ResponseEntity.ok().body(responses);
    }

    // 게시글에 딸린 첨부파일 페이징
    @GetMapping("/boards/{boardId}/files")
    public ResponseEntity<List<FileListInfo>> getBoardFiles(
            @PathVariable Long boardId
    ) {
        List<FileListInfo> responses = boardAndCommentRetriever.retrieveBoardFiles(boardId);

        return ResponseEntity.ok().body(responses);
    }
    
    // 임시작성 글 / 수정할 내 게시글 편집가능 모드로 불러오기
    @GetMapping("/boards/{boardId}/edit-mode")
    public ResponseEntity<BoardDetailForEditResponse> getBoardForEdit(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId
    ) {
        //아직 published안된것만 으로 쿼리 별도로 만들어야함
        BoardDetailForEditResponse response = boardAndCommentRetriever
                .retrieveMyBoardDetail(details.getEmpId(), boardId);

        return ResponseEntity.ok().body(response);
    }

    //임시저장된거 리스팅
    @GetMapping("/my/boards/drafts")
    public ResponseEntity<List<BoardDraftsResponse>> getUnpublishedBoards(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<BoardDraftsResponse> response = boardAndCommentRetriever.retrieveMyBoardDrafts(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }
    

}
