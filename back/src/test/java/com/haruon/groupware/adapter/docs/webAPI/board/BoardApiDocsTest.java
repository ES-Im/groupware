package com.haruon.groupware.adapter.docs.webapi.board;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.board.*;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCategoryNameRequest;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCommentRequest;
import com.haruon.groupware.application.board.provided.forCommand.BoardManagement;
import com.haruon.groupware.application.board.provided.forCommand.CategoryManagement;
import com.haruon.groupware.application.board.provided.forCommand.CommentManagement;
import com.haruon.groupware.application.board.provided.forRetriever.BoardAndCommentRetriever;
import com.haruon.groupware.application.board.provided.forRetriever.CategoryRetriever;
import com.haruon.groupware.application.board.service.command.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.command.dto.BoardUpdateRequest;
import com.haruon.groupware.application.board.service.query.dto.*;
import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoardApiDocsTest extends RestDocsSupport {

    private static final String AUTHORIZATION = "Bearer accessToken";
    private static final LocalDateTime PUBLISHED_AT = LocalDateTime.of(2026, 3, 1, 10, 0);
    private static final LocalDateTime MODIFIED_AT = LocalDateTime.of(2026, 3, 1, 11, 0);

    private final CategoryRetriever categoryRetriever = mock(CategoryRetriever.class);
    private final CategoryManagement categoryManagement = mock(CategoryManagement.class);
    private final BoardManagement boardManagement = mock(BoardManagement.class);
    private final BoardAndCommentRetriever boardAndCommentRetriever = mock(BoardAndCommentRetriever.class);
    private final CommentManagement commentManagement = mock(CommentManagement.class);

    @Override
    protected Object[] initControllers() {
        return new Object[]{
                new CategoryQueryApi(categoryRetriever),
                new CategoryCommandApi(categoryManagement),
                new BoardCommandApi(boardManagement),
                new BoardQueryApi(boardAndCommentRetriever),
                new CommentCommandApi(commentManagement)
        };
    }

    @Test
    @DisplayName("카테고리 관리 목록 조회")
    void getCategoriesForManagement() throws Exception {
        List<CategoryResponse> responses = List.of(new CategoryResponse(1L, "공지사항", true));

        when(categoryRetriever.retrieveCategoriesForManagement(eq(1L), eq("공지"), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(responses, PageRequest.of(0, 10), responses.size()));

        mockMvc.perform(
                get("/api/categories/management")
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .param("keyword", "공지")
                        .param("isVisible", "true")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("CATEGORY_MANAGEMENT",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        queryParameters(
                                parameterWithName("keyword").optional().description("카테고리명 검색어"),
                                parameterWithName("isVisible").optional().description("노출 여부 필터"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(categoryPageFields())
                ));
    }

    @Test
    @DisplayName("노출 카테고리 목록 조회")
    void getVisibleCategories() throws Exception {
        when(categoryRetriever.retrieveVisibleCategories())
                .thenReturn(List.of(new CategoryResponse(1L, "공지사항", true)));

        mockMvc.perform(
                get("/api/categories")
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("CATEGORY_LIST",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        responseFields(
                                fieldWithPath("[].categoryId").type(JsonFieldType.NUMBER).description("카테고리 식별 번호"),
                                fieldWithPath("[].categoryName").type(JsonFieldType.STRING).description("카테고리명"),
                                fieldWithPath("[].isVisible").type(JsonFieldType.BOOLEAN).description("노출 여부")
                        )
                ));
    }

    @Test
    @DisplayName("카테고리 등록")
    void registerCategory() throws Exception {
        CommandCategoryNameRequest request = new CommandCategoryNameRequest("자료실");

        when(categoryManagement.registerCategory(eq(1L), eq("자료실")))
                .thenReturn(1L);

        mockMvc.perform(
                post("/api/categories")
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isCreated())
                .andDo(document("CATEGORY_REGISTER",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        requestFields(categoryNameRequestFields())
                ));
    }

    @Test
    @DisplayName("카테고리명 변경")
    void updateCategoryName() throws Exception {
        CommandCategoryNameRequest request = new CommandCategoryNameRequest("새 공지사항");

        doNothing().when(categoryManagement)
                .changeCategoryName(eq(1L), eq(1L), eq("새 공지사항"));

        mockMvc.perform(
                patch("/api/categories/{categoryId}/name", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("CATEGORY_UPDATE_NAME",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("categoryId").description("카테고리 식별 번호")
                        ),
                        requestFields(categoryNameRequestFields())
                ));
    }

    @Test
    @DisplayName("카테고리 노출")
    void activateCategory() throws Exception {
        doNothing().when(categoryManagement).showCategory(eq(1L), eq(1L));

        mockMvc.perform(
                patch("/api/categories/{categoryId}/visibility/activation", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("CATEGORY_ACTIVATE",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("categoryId").description("카테고리 식별 번호")
                        )
                ));
    }

    @Test
    @DisplayName("카테고리 숨김")
    void deactivateCategory() throws Exception {
        doNothing().when(categoryManagement).hideCategory(eq(1L), eq(1L));

        mockMvc.perform(
                patch("/api/categories/{categoryId}/visibility/deactivation", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("CATEGORY_DEACTIVATE",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("categoryId").description("카테고리 식별 번호")
                        )
                ));
    }

    @Test
    @DisplayName("게시글 등록")
    void registerBoard() throws Exception {
        BoardCreateRequest request = BoardCreateRequest.builder()
                .categoryId(1L)
                .title("공지사항")
                .content("게시글 본문")
                .publishedAt(PUBLISHED_AT)
                .build();

        when(boardManagement.registerBoard(eq(1L), any(BoardCreateRequest.class)))
                .thenReturn(1L);

        mockMvc.perform(
                post("/api/boards")
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isCreated())
                .andDo(document("BOARD_REGISTER",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        requestFields(
                                fieldWithPath("categoryId").type(JsonFieldType.NUMBER)
                                        .attributes(key("constraints").value("필수"))
                                        .description("카테고리 식별 번호"),
                                fieldWithPath("title").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 50자 이하, 공백 불가"))
                                        .description("게시글 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가"))
                                        .description("게시글 본문"),
                                fieldWithPath("publishedAt").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("선택"))
                                        .description("발행 시각. 미입력 시 임시저장")
                        )
                ));
    }

    @Test
    @DisplayName("임시저장 게시글 발행")
    void publishBoardDraft() throws Exception {
        doNothing().when(boardManagement)
                .publishBoard(eq(1L), eq(1L), any(LocalDateTime.class));

        mockMvc.perform(
                patch("/api/boards/{boardId}/publishment", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("BOARD_PUBLISH",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        )
                ));
    }

    @Test
    @DisplayName("게시글 수정")
    void updateBoard() throws Exception {
        BoardUpdateRequest request = BoardUpdateRequest.builder()
                .categoryId(2L)
                .title("수정된 제목")
                .content("수정된 본문")
                .modifiedAt(MODIFIED_AT)
                .build();

        doNothing().when(boardManagement)
                .changeBoard(eq(1L), eq(1L), any(BoardUpdateRequest.class));

        mockMvc.perform(
                patch("/api/boards/{boardId}", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("BOARD_UPDATE",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        requestFields(
                                fieldWithPath("categoryId").optional().type(JsonFieldType.NUMBER)
                                        .attributes(key("constraints").value("선택"))
                                        .description("변경할 카테고리 식별 번호"),
                                fieldWithPath("title").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("선택, 공백 불가"))
                                        .description("변경할 게시글 제목"),
                                fieldWithPath("content").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("선택, 공백 불가"))
                                        .description("변경할 게시글 본문"),
                                fieldWithPath("modifiedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수"))
                                        .description("수정 시각")
                        )
                ));
    }

    @Test
    @DisplayName("카테고리별 게시글 목록 조회")
    void getBoardsByCategory() throws Exception {
        List<BoardSummaryResponse> responses = List.of(
                new BoardSummaryResponse(1L, "첫 번째 게시글", "홍길동", PUBLISHED_AT, 10L, 2L, 1L, true)
        );

        when(boardAndCommentRetriever.retrieveBoardSummaries(eq(1L), eq("첫"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(responses, PageRequest.of(0, 10), responses.size()));

        mockMvc.perform(
                get("/api/categories/{categoryId}/boards", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .param("keyword", "첫")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_LIST",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("categoryId").description("카테고리 식별 번호")
                        ),
                        queryParameters(
                                parameterWithName("keyword").optional().description("게시글 제목 검색어"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(boardSummaryPageFields())
                ));
    }

    @Test
    @DisplayName("카테고리별 최신 게시글 조회")
    void getLatestBoardsByCategory() throws Exception {
        when(boardAndCommentRetriever.retrieveLatestBoards(eq(1L), eq(5L)))
                .thenReturn(List.of(new LatestBoardSummaryResponse(1L, "공지사항", "홍길동", PUBLISHED_AT)));

        mockMvc.perform(
                get("/api/categories/{categoryId}/boards/latest", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .param("limit", "5")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_LATEST",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("categoryId").description("카테고리 식별 번호")
                        ),
                        queryParameters(
                                parameterWithName("limit").optional().description("조회할 최신 게시글 수")
                        ),
                        responseFields(
                                fieldWithPath("[].boardId").type(JsonFieldType.NUMBER).description("게시글 식별 번호"),
                                fieldWithPath("[].title").type(JsonFieldType.STRING).description("게시글 제목"),
                                fieldWithPath("[].authorName").type(JsonFieldType.STRING).description("작성자명"),
                                fieldWithPath("[].publishedAt").type(JsonFieldType.STRING).description("발행 시각")
                        )
                ));
    }

    @Test
    @DisplayName("게시글 상세 조회")
    void getBoardDetail() throws Exception {
        BoardDetailResponse response = new BoardDetailResponse(
                1L, 1L, 1L, "홍길동", "공지사항", "게시글 본문", PUBLISHED_AT, MODIFIED_AT, 2L, 10L, 1L, false
        );

        when(boardAndCommentRetriever.retrieveBoardDetail(eq(1L)))
                .thenReturn(response);

        mockMvc.perform(
                get("/api/boards/{boardId}", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_DETAIL",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        responseFields(
                                fieldWithPath("boardId").type(JsonFieldType.NUMBER).description("게시글 식별 번호"),
                                fieldWithPath("categoryId").type(JsonFieldType.NUMBER).description("카테고리 식별 번호"),
                                fieldWithPath("empId").type(JsonFieldType.NUMBER).description("작성자 사원 식별 번호"),
                                fieldWithPath("authorName").type(JsonFieldType.STRING).description("작성자명"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("게시글 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING).description("게시글 본문"),
                                fieldWithPath("publishedAt").type(JsonFieldType.STRING).description("발행 시각"),
                                fieldWithPath("modifiedAt").optional().type(JsonFieldType.STRING).description("수정 시각"),
                                fieldWithPath("likeCount").type(JsonFieldType.NUMBER).description("좋아요 수"),
                                fieldWithPath("viewCount").type(JsonFieldType.NUMBER).description("조회 수"),
                                fieldWithPath("commentCount").type(JsonFieldType.NUMBER).description("댓글 수"),
                                fieldWithPath("isDraft").type(JsonFieldType.BOOLEAN).description("임시저장 여부")
                        )
                ));
    }

    @Test
    @DisplayName("게시글 댓글 목록 조회")
    void getBoardComments() throws Exception {
        List<BoardCommentResponse> responses = List.of(
                new BoardCommentResponse(1L, 2L, 1L, "홍길동", "댓글 내용", PUBLISHED_AT.plusMinutes(5), false, false)
        );

        when(boardAndCommentRetriever.retrieveBoardComments(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(responses, PageRequest.of(0, 10), responses.size()));

        mockMvc.perform(
                get("/api/boards/{boardId}/comments", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_COMMENTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        queryParameters(
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(boardCommentPageFields())
                ));
    }

    @Test
    @DisplayName("게시글 첨부파일 목록 조회")
    void getBoardFiles() throws Exception {
        when(boardAndCommentRetriever.retrieveBoardFiles(eq(1L)))
                .thenReturn(List.of(new FileListInfo(1L, "notice.pdf", "pdf", 1024L)));

        mockMvc.perform(
                get("/api/boards/{boardId}/files", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_FILES",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        responseFields(
                                fieldWithPath("[].fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("[].originalName").type(JsonFieldType.STRING).description("원본 파일명"),
                                fieldWithPath("[].extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("[].fileSize").type(JsonFieldType.NUMBER).description("파일 크기")
                        )
                ));
    }

    @Test
    @DisplayName("게시글 편집 모드 조회")
    void getBoardForEdit() throws Exception {
        BoardDetailForEditResponse response = new BoardDetailForEditResponse(1L, 1L, "공지사항", "게시글 본문");

        when(boardAndCommentRetriever.retrieveMyBoardDetail(eq(1L), eq(1L)))
                .thenReturn(response);

        mockMvc.perform(
                get("/api/boards/{boardId}/edit-mode", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_EDIT_MODE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        responseFields(
                                fieldWithPath("boardId").type(JsonFieldType.NUMBER).description("게시글 식별 번호"),
                                fieldWithPath("categoryId").type(JsonFieldType.NUMBER).description("카테고리 식별 번호"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("게시글 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING).description("게시글 본문")
                        )
                ));
    }

    @Test
    @DisplayName("내 임시저장 게시글 목록 조회")
    void getUnpublishedBoards() throws Exception {
        when(boardAndCommentRetriever.retrieveMyBoardDrafts(eq(1L)))
                .thenReturn(List.of(new BoardDraftsResponse(1L, "임시저장 글", MODIFIED_AT)));

        mockMvc.perform(
                get("/api/my/boards/drafts")
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("BOARD_DRAFTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        authorizationHeader(),
                        responseFields(
                                fieldWithPath("[].boardId").type(JsonFieldType.NUMBER).description("게시글 식별 번호"),
                                fieldWithPath("[].title").type(JsonFieldType.STRING).description("게시글 제목"),
                                fieldWithPath("[].updatedAt").type(JsonFieldType.STRING).description("최근 수정 시각")
                        )
                ));
    }

    @Test
    @DisplayName("댓글 등록")
    void createComment() throws Exception {
        CommandCommentRequest request = new CommandCommentRequest("댓글 내용");

        when(commentManagement.registerComment(eq(1L), eq(1L), eq("댓글 내용"), any(LocalDateTime.class)))
                .thenReturn(1L);

        mockMvc.perform(
                post("/api/boards/{boardId}/comments", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isCreated())
                .andDo(document("COMMENT_REGISTER",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호")
                        ),
                        requestFields(commentRequestFields())
                ));
    }

    @Test
    @DisplayName("대댓글 등록")
    void createReply() throws Exception {
        CommandCommentRequest request = new CommandCommentRequest("대댓글 내용");

        when(commentManagement.registerReply(eq(1L), eq(1L), eq(2L), eq("대댓글 내용"), any(LocalDateTime.class)))
                .thenReturn(3L);

        mockMvc.perform(
                post("/api/boards/{boardId}/comments/{parentCommentId}/replies", 1L, 2L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isCreated())
                .andDo(document("COMMENT_REPLY",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호"),
                                parameterWithName("parentCommentId").description("부모 댓글 식별 번호")
                        ),
                        requestFields(commentRequestFields())
                ));
    }

    @Test
    @DisplayName("댓글 수정")
    void updateComment() throws Exception {
        CommandCommentRequest request = new CommandCommentRequest("수정된 댓글");

        doNothing().when(commentManagement)
                .updateComment(eq(1L), eq(1L), eq(2L), eq("수정된 댓글"), any(LocalDateTime.class));

        mockMvc.perform(
                patch("/api/boards/{boardId}/comments/{commentId}", 1L, 2L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("COMMENT_UPDATE",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호"),
                                parameterWithName("commentId").description("댓글 식별 번호")
                        ),
                        requestFields(commentRequestFields())
                ));
    }

    @Test
    @DisplayName("댓글 삭제")
    void deleteComment() throws Exception {
        doNothing().when(commentManagement)
                .deleteComment(eq(1L), eq(1L), eq(2L));

        mockMvc.perform(
                delete("/api/boards/{boardId}/comments/{commentId}", 1L, 2L)
                        .with(employeeAuthentication())
                        .header("Authorization", AUTHORIZATION)
        )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(document("COMMENT_DELETE",
                        preprocessRequest(prettyPrint()),
                        authorizationHeader(),
                        pathParameters(
                                parameterWithName("boardId").description("게시글 식별 번호"),
                                parameterWithName("commentId").description("댓글 식별 번호")
                        )
                ));
    }

    private static org.springframework.restdocs.snippet.Snippet authorizationHeader() {
        return requestHeaders(
                headerWithName("Authorization").description("Bearer Access Token")
        );
    }

    private static FieldDescriptor[] categoryNameRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("categoryName").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("30자 이하, 공백 불가"))
                        .description("카테고리명")
        };
    }

    private static FieldDescriptor[] commentRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("content").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("300자 이하, 공백 불가"))
                        .description("댓글 내용")
        };
    }

    private static FieldDescriptor[] categoryPageFields() {
        return pageFields(
                "카테고리 목록",
                fieldWithPath("content[].categoryId").type(JsonFieldType.NUMBER).description("카테고리 식별 번호"),
                fieldWithPath("content[].categoryName").type(JsonFieldType.STRING).description("카테고리명"),
                fieldWithPath("content[].isVisible").type(JsonFieldType.BOOLEAN).description("노출 여부")
        );
    }

    private static FieldDescriptor[] boardSummaryPageFields() {
        return pageFields(
                "게시글 목록",
                fieldWithPath("content[].boardId").type(JsonFieldType.NUMBER).description("게시글 식별 번호"),
                fieldWithPath("content[].boardTitle").type(JsonFieldType.STRING).description("게시글 제목"),
                fieldWithPath("content[].authorName").type(JsonFieldType.STRING).description("작성자명"),
                fieldWithPath("content[].publishedAt").type(JsonFieldType.STRING).description("발행 시각"),
                fieldWithPath("content[].viewCount").type(JsonFieldType.NUMBER).description("조회 수"),
                fieldWithPath("content[].likeCount").type(JsonFieldType.NUMBER).description("좋아요 수"),
                fieldWithPath("content[].commentCount").type(JsonFieldType.NUMBER).description("댓글 수"),
                fieldWithPath("content[].isFileAttached").type(JsonFieldType.BOOLEAN).description("첨부파일 존재 여부")
        );
    }

    private static FieldDescriptor[] boardCommentPageFields() {
        return pageFields(
                "댓글 목록",
                fieldWithPath("content[].parentCommentId").optional().type(JsonFieldType.NUMBER).description("부모 댓글 식별 번호"),
                fieldWithPath("content[].commentId").type(JsonFieldType.NUMBER).description("댓글 식별 번호"),
                fieldWithPath("content[].writerEmpId").optional().type(JsonFieldType.NUMBER).description("작성자 사원 식별 번호"),
                fieldWithPath("content[].writerEmpName").optional().type(JsonFieldType.STRING).description("작성자명"),
                fieldWithPath("content[].content").optional().type(JsonFieldType.STRING).description("댓글 내용"),
                fieldWithPath("content[].registerAt").optional().type(JsonFieldType.STRING).description("등록 시각"),
                fieldWithPath("content[].isEdited").optional().type(JsonFieldType.BOOLEAN).description("수정 여부"),
                fieldWithPath("content[].isDeleted").type(JsonFieldType.BOOLEAN).description("삭제 여부")
        );
    }

    private static FieldDescriptor[] pageFields(String contentDescription, FieldDescriptor... contentFields) {
        List<FieldDescriptor> fields = new ArrayList<>();
        fields.add(fieldWithPath("content").type(JsonFieldType.ARRAY).description(contentDescription));
        fields.addAll(List.of(contentFields));
        fields.add(fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 데이터 수"));
        fields.add(fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"));
        fields.add(fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"));
        fields.add(fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"));
        fields.add(fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지 데이터 수"));
        fields.add(fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"));
        fields.add(fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"));
        fields.add(fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"));
        fields.add(subsectionWithPath("pageable").ignored());
        fields.add(subsectionWithPath("sort").ignored());
        return fields.toArray(FieldDescriptor[]::new);
    }
}
