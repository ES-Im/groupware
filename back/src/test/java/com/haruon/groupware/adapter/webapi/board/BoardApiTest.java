package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCategoryNameRequest;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCommentRequest;
import com.haruon.groupware.application.board.required.BoardCommentRepository;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.board.service.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.dto.BoardUpdateRequest;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.BoardComment;
import com.haruon.groupware.domain.board.Category;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoardApiTest extends IntegrationTestSupport {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private BoardCommentRepository boardCommentRepository;

    @BeforeEach
    void cleanBoardDataBeforeEach() {
        cleanBoardData();
    }

    @AfterEach
    void cleanBoardDataAfterEach() {
        cleanBoardData();
    }

    private void cleanBoardData() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transactionTemplate.executeWithoutResult(status -> {
            entityManager.createQuery("update BoardComment c set c.parentComment = null").executeUpdate();
            entityManager.createQuery("delete from BoardComment").executeUpdate();
            entityManager.createQuery("delete from BoardLike").executeUpdate();
            entityManager.createQuery("delete from BoardFile").executeUpdate();
            entityManager.createQuery("delete from Board").executeUpdate();
            entityManager.createQuery("delete from Category").executeUpdate();
            entityManager.clear();
        });
    }

    @Test
    @DisplayName("카테고리 명령 API")
    void category_command_api_success() throws Exception {
        String adminToken = adminAccessToken("board-admin");
        Category category = category("공지사항");
        category.changeVisibility(false);
        categoryRepository.save(category);

        mockMvc.perform(
                post("/api/categories")
                        .header("Authorization", BEARER + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CommandCategoryNameRequest("자료실")))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated());

        mockMvc.perform(
                patch("/api/categories/{categoryId}/name", category.getId())
                        .header("Authorization", BEARER + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CommandCategoryNameRequest("새 공지사항")))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(categoryRepository.findById(category.getId()).orElseThrow().getName())
                .isEqualTo("새 공지사항");

        mockMvc.perform(
                patch("/api/categories/{categoryId}/visibility/activation", category.getId())
                        .header("Authorization", BEARER + adminToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(categoryRepository.findById(category.getId()).orElseThrow().isVisible())
                .isTrue();

        mockMvc.perform(
                patch("/api/categories/{categoryId}/visibility/deactivation", category.getId())
                        .header("Authorization", BEARER + adminToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(categoryRepository.findById(category.getId()).orElseThrow().isVisible())
                .isFalse();
    }

    @Test
    @DisplayName("카테고리 조회 API")
    void category_query_api_success() throws Exception {
        String adminToken = adminAccessToken("category-query-admin");
        String employeeToken = employeeAccessToken("category-query-emp");
        Category visible = category("공지사항");
        Category hidden = category("숨김");
        hidden.changeVisibility(false);
        categoryRepository.save(hidden);

        mockMvc.perform(
                get("/api/categories/management")
                        .header("Authorization", BEARER + adminToken)
                        .param("keyword", "공지")
                        .param("isVisible", "true")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].categoryId").value(visible.getId()))
                .andExpect(jsonPath("$.content[0].categoryName").value("공지사항"));

        mockMvc.perform(
                get("/api/categories")
                        .header("Authorization", BEARER + employeeToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryId").value(visible.getId()))
                .andExpect(jsonPath("$[0].categoryName").value("공지사항"));
    }

    @Test
    @DisplayName("게시글 명령 API")
    void board_command_api_success() throws Exception {
        String authorLoginId = unique("board-author");
        String accessToken = employeeAccessToken(authorLoginId);
        Emp author = emp(authorLoginId);
        Category category = category("게시판");

        BoardCreateRequest createRequest = BoardCreateRequest.builder()
                .categoryId(category.getId())
                .title("임시 글")
                .content("본문")
                .build();

        mockMvc.perform(
                post("/api/boards")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated());

        Board draft = draftBoard(author, category, "발행할 글");

        mockMvc.perform(
                patch("/api/boards/{boardId}/publishment", draft.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(boardRepository.findById(draft.getId()).orElseThrow().isDraft())
                .isFalse();

        Board published = publishedBoard(author, category, "수정 전 제목");
        BoardUpdateRequest updateRequest = BoardUpdateRequest.builder()
                .categoryId(category.getId())
                .title("수정 후 제목")
                .content("수정 후 본문")
                .modifiedAt(LocalDateTime.of(2026, 3, 2, 10, 0))
                .build();

        mockMvc.perform(
                patch("/api/boards/{boardId}", published.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Board updated = boardRepository.findById(published.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("수정 후 제목");
        assertThat(updated.getContent()).isEqualTo("수정 후 본문");
    }

    @Test
    @DisplayName("게시글 조회 API")
    void board_query_api_success() throws Exception {
        String authorLoginId = unique("board-query-author");
        String accessToken = employeeAccessToken(authorLoginId);
        Emp author = emp(authorLoginId);
        Category category = category("공지");
        Board board = publishedBoard(author, category, "첫 번째 게시글");
        board.addBoardFile(
                author,
                "application/pdf",
                "notice.pdf",
                unique("stored-notice") + ".pdf",
                "pdf",
                1024L,
                "/test/board",
                LocalDateTime.of(2026, 3, 1, 11, 0)
        );
        boardRepository.save(board);
        BoardComment comment = comment(board, author, "댓글");
        Board draft = draftBoard(author, category, "임시저장 글");

        mockMvc.perform(
                get("/api/categories/{categoryId}/boards", category.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("keyword", "첫 번째")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].boardId").value(board.getId()))
                .andExpect(jsonPath("$.content[0].boardTitle").value("첫 번째 게시글"));

        mockMvc.perform(
                get("/api/categories/{categoryId}/boards/latest", category.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("limit", "5")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].boardId").value(board.getId()));

        mockMvc.perform(
                get("/api/boards/{boardId}", board.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boardId").value(board.getId()))
                .andExpect(jsonPath("$.title").value("첫 번째 게시글"));

        mockMvc.perform(
                get("/api/boards/{boardId}/comments", board.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].commentId").value(comment.getId()))
                .andExpect(jsonPath("$.content[0].content").value("댓글"));

        mockMvc.perform(
                get("/api/boards/{boardId}/files", board.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].originalName").value("notice.pdf"));

        mockMvc.perform(
                get("/api/boards/{boardId}/edit-mode", board.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boardId").value(board.getId()))
                .andExpect(jsonPath("$.title").value("첫 번째 게시글"));

        mockMvc.perform(
                get("/api/my/boards/drafts")
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].boardId").value(draft.getId()))
                .andExpect(jsonPath("$[0].title").value("임시저장 글"));
    }

    @Test
    @DisplayName("댓글 명령 API")
    void comment_command_api_success() throws Exception {
        String authorLoginId = unique("comment-author");
        String accessToken = employeeAccessToken(authorLoginId);
        Emp author = emp(authorLoginId);
        Category category = category("댓글 게시판");
        Board board = publishedBoard(author, category, "댓글 테스트 게시글");

        mockMvc.perform(
                post("/api/boards/{boardId}/comments", board.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CommandCommentRequest("첫 댓글")))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated());

        BoardComment parentComment = comment(board, author, "부모 댓글");

        mockMvc.perform(
                post("/api/boards/{boardId}/comments/{parentCommentId}/replies", board.getId(), parentComment.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CommandCommentRequest("대댓글")))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated());

        BoardComment editableComment = comment(board, author, "수정 전 댓글");

        mockMvc.perform(
                patch("/api/boards/{boardId}/comments/{commentId}", board.getId(), editableComment.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CommandCommentRequest("수정 후 댓글")))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(boardCommentRepository.findById(editableComment.getId()).orElseThrow().getContent())
                .isEqualTo("수정 후 댓글");

        BoardComment deletableComment = comment(board, author, "삭제할 댓글");

        mockMvc.perform(
                delete("/api/boards/{boardId}/comments/{commentId}", board.getId(), deletableComment.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        assertThat(boardCommentRepository.findById(deletableComment.getId()).orElseThrow().isDeleted())
                .isTrue();
    }

    private String employeeAccessToken(String loginId) throws Exception {
        activatedEmp(loginId, PASSWORD);
        return loginByIdAndPw(loginId, PASSWORD);
    }

    private String adminAccessToken(String loginId) throws Exception {
        registerAdmin(loginId, PASSWORD);
        return loginByIdAndPw(loginId, PASSWORD);
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId)
                .orElseThrow();
    }

    private Category category(String name) {
        return categoryRepository.save(Category.create(name));
    }

    private Board publishedBoard(Emp author, Category category, String title) {
        return boardRepository.save(Board.create(
                author,
                category,
                title,
                "게시글 본문",
                false,
                LocalDateTime.of(2026, 3, 1, 10, 0)
        ));
    }

    private Board draftBoard(Emp author, Category category, String title) {
        return boardRepository.save(Board.create(
                author,
                category,
                title,
                "임시저장 본문",
                true,
                null
        ));
    }

    private BoardComment comment(Board board, Emp author, String content) {
        BoardComment comment = BoardComment.createComment(
                board,
                author,
                content,
                board.getPublishedAt().plusMinutes(1)
        );
        return boardCommentRepository.save(comment);
    }

    private static String unique(String prefix) {
        return prefix + SEQUENCE.incrementAndGet();
    }
}
