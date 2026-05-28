package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.board.service.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.dto.BoardFileRequest;
import com.haruon.groupware.application.board.service.dto.BoardUpdateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.BoardFile;
import com.haruon.groupware.domain.board.Category;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.board.provided.BoardFixture.*;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static java.time.LocalDateTime.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Slf4j
@TestIntegrationConfig
record BoardManagementTest(
        BoardManagement boardManagement,
        CategoryManagement categoryManagement,

        EmpRepository empRepository,
        CategoryRepository categoryRepository,
        BoardRepository boardRepository,

        EntityManager em
) {

    @AfterEach
    void tearDown() {
        boardRepository.deleteAll();
        categoryRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Test
    @DisplayName("게시글 생성 테스트 - 임시저장 게시글")
    void unpublished_registerBoard_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        String title = "test";
        String content = "test";

        long unPublishedBoard = boardManagement.registerBoard(
                author.getId(),
                BoardCreateRequest.builder()
                        .categoryId(categoryId)
                        .title(title)
                        .content(content)
                        .build()
        );

        Board board = boardRepository.findById(unPublishedBoard).orElseThrow();
        Category category = categoryRepository.findById(categoryId).orElseThrow();

        assertThat(board).extracting(
                Board::getEmp, Board::getCategory, Board::getTitle, Board::getContent
        ).containsExactly(
                author, category, title, content
        );

        assertThat(board.getPublishedAt())
                .as("미발행(임시저장)시, 발행시각값은 NULL")
                .isNull();

        assertThat(board.isDraft())
                .as("미발행시, 초안여부는 true")
                .isTrue();
    }

    @Test
    @DisplayName("게시글 생성 테스트 - 발행 게시글")
    void published_registerBoard_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        String title = "test";
        String content = "test";
        LocalDateTime publishedAt = LocalDateTime.of(2026, 3, 1, 0, 0, 0);

        long publishedBoard = boardManagement.registerBoard(
                author.getId(),
                BoardCreateRequest.builder()
                        .categoryId(categoryId)
                        .title(title)
                        .content(content)
                        .publishedAt(publishedAt)
                        .build()
        );

        Board board = boardRepository.findById(publishedBoard).orElseThrow();
        Category category = categoryRepository.findById(categoryId).orElseThrow();

        assertThat(board).extracting(
                Board::getEmp, Board::getCategory, Board::getTitle, Board::getContent, Board::getPublishedAt
        ).containsExactly(
                author, category, title, content, publishedAt
        );

        assertThat(board.isDraft())
                .as("발행시, 초안여부는 false")
                .isFalse();
    }

    @Test
    @DisplayName("게시글 발행 테스트")
    void publishBoard_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long unPublishedBoard = getUnPublishedBoard(boardManagement, author, categoryId);

        LocalDateTime publishedAt = of(2026, 3, 1, 0, 0, 0);
        boardManagement.publishBoard(author.getId(), unPublishedBoard, publishedAt);

        Board board = boardRepository.findById(unPublishedBoard).orElseThrow();

        assertThat(board.getPublishedAt())
                .as("발행시, 발행시각이 기록")
                .isEqualTo(publishedAt);

        assertThat(board.isDraft())
                .as("발행시, 초안여부는 false")
                .isFalse();
    }

    @Test
    @DisplayName("게시글 발행 테스트 - 이미 발행된 게시글을 발행할 수 없다.")
    void  publish_publishBoard_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);

        assertThatThrownBy(() ->
                boardManagement.publishBoard(author.getId(), publishedBoard, of(2026, 3, 1, 0, 0, 0))
        ).hasMessage("임시저장 상태에서만 게시글 발행 가능");
    }

    @Test
    @DisplayName("게시글 발행 테스트 - 작성자가 아니라면 발행할 수 없다.")
    void  publish_Board_by_not_author_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long unPublishedBoard = getUnPublishedBoard(boardManagement, author, categoryId);

        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "otherEmp");
        assertThatThrownBy(() ->
                boardManagement.publishBoard(otherEmp.getId(), unPublishedBoard, of(2026, 3, 1, 0, 0, 0))
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("게시글 수정 테스트 - 발행전")
    void change_unpublished_Board_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long unPublishedBoard = getUnPublishedBoard(boardManagement, author, categoryId);

        long editedCategory = getSavedCategory(categoryManagement, admin, "editedCategory");
        String editedTitle = "editedTitle";
        String editedContent = "editedContent";
        LocalDateTime editedModifiedAt = of(2026, 3, 2, 0, 0, 0);


        boardManagement.changeBoard(
                author.getId(),
                unPublishedBoard,
                BoardUpdateRequest.builder()
                        .categoryId(editedCategory)
                        .title(editedTitle)
                        .content(editedContent)
                        .modifiedAt(editedModifiedAt)
                .build()
        );

        Board board = boardRepository.findById(unPublishedBoard).orElseThrow();

        assertThat(board).extracting(
                Board::getCategory, Board::getTitle, Board::getContent
        ).containsExactly(
                categoryRepository.findById(editedCategory).orElseThrow(),
                editedTitle, editedContent
        );

        assertThat(board.getModifiedAt())
                .as("발행전이라면 수정일시를 입력해도 null이 유지된다.")
                .isNull();
    }

    @Test
    @DisplayName("게시글 수정 테스트 - 발행후")
    void change_published_Board_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);

        long editedCategory = getSavedCategory(categoryManagement, admin, "editedCategory");
        String editedTitle = "editedTitle";
        String editedContent = "editedContent";
        LocalDateTime editedModifiedAt = of(2026, 3, 2, 0, 0, 0);

        boardManagement.changeBoard(
                author.getId(),
                publishedBoard,
                BoardUpdateRequest.builder()
                        .categoryId(editedCategory)
                        .title(editedTitle)
                        .content(editedContent)
                        .modifiedAt(editedModifiedAt)
                        .build()
        );

        Board board = boardRepository.findById(publishedBoard).orElseThrow();

        assertThat(board).extracting(
                Board::getCategory, Board::getTitle, Board::getContent
        ).containsExactly(
                categoryRepository.findById(editedCategory).orElseThrow(),
                editedTitle, editedContent
        );

        assertThat(board.getModifiedAt())
                .as("발행 후라면 수정일시가 입력되는대로 저장된다.")
                .isEqualTo(editedModifiedAt);
    }

    @Test
    @DisplayName("게시글 수정 테스트 - 작성자가 아니라면 게시글을 수정할 수 없다.")
    void changeBoard_by_not_author_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "otherEmp");

        assertThatThrownBy(() ->
                boardManagement.changeBoard(
                        otherEmp.getId(), publishedBoard,
                        BoardUpdateRequest.builder()
                                .title("edited")
                                .modifiedAt(LocalDateTime.of(2026,3,3,0,0,0))
                                .build()
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("게시글 수정 테스트 - 수정일시가 없다면 수정할 수 없다.")
    void changeBoard_without_modifiedAt_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);

        assertThatThrownBy(() ->
                boardManagement.changeBoard(
                        author.getId(),
                        publishedBoard,
                        BoardUpdateRequest.builder()
                                .title("editedTitle")
                                .modifiedAt(null)
                                .build()
                )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @Transactional
    @DisplayName("게시글 파일 첨부 테스트")
    void addFile_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long unPublishedBoard = getUnPublishedBoard(boardManagement, author, categoryId);
        String fileName = "test.pdf";
        String mimeType = "application/pdf";
        long fileSize = 20 * 1024 * 1024L;
        LocalDateTime modifiedAt = of(2026, 3, 2, 0, 0, 0);

        boardManagement.addFile(
                author.getId(),
                unPublishedBoard,
                BoardFileRequest.builder()
                        .file(FileDto.builder()
                                .mimeType(mimeType)
                                .originalFileFullName(fileName)
                                .fileSize(fileSize)
                                .bytes(new byte[]{1})
                                .build()
                        )
                        .modifiedAt(modifiedAt)
                .build()
        );

        Board board = boardRepository.findById(unPublishedBoard).orElseThrow();

        assertThat(board.getBoardFiles()).singleElement().extracting(
                BoardFile::getBoard, BoardFile::getOriginalName, BoardFile::getExtension,
                BoardFile::getFileSize, BoardFile::getMimeType
        ).containsExactly(
                board,
                fileName.substring(0, fileName.lastIndexOf('.')),
                fileName.substring(fileName.lastIndexOf('.')+1),
                fileSize, mimeType
        );

        assertThat(board.getModifiedAt())
                .as("미상신이라면 수정일시 Null")
                .isNull();
    }


    @Test
    @Transactional
    @DisplayName("게시글 파일 첨부 테스트 - 작성자가 아니라면 파일첨부를 할 수 없다.")
    void addFile_by_not_author_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long unPublishedBoard = getUnPublishedBoard(boardManagement, author, categoryId);

        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "otherEmp");

        em.flush(); em.clear();

        assertThatThrownBy(() ->
                boardManagement.addFile(
                        otherEmp.getId(),
                        unPublishedBoard,
                        BoardFileRequest.builder()
                                .file(FileDto.builder()
                                        .mimeType("application/pdf")
                                        .originalFileFullName("test.pdf")
                                        .fileSize(20 * 1024 * 1024L)
                                        .bytes(new byte[]{1})
                                        .build()
                                )
                                .modifiedAt(of(2026, 3, 2, 0, 0, 0))
                                .build()
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @Transactional
    @DisplayName("게시글 파일 첨부 테스트 - 파일 첨부 시, 수정일시가 없다면 실패")
    void addFile_without_modifiedAt_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);

        em.flush(); em.clear();

        assertThatThrownBy(() ->
                boardManagement.addFile(
                        author.getId(),
                        publishedBoard,
                        BoardFileRequest.builder()
                                .file(FileDto.builder()
                                        .mimeType("application/pdf")
                                        .originalFileFullName("test.pdf")
                                        .fileSize(20 * 1024 * 1024L)
                                        .bytes(new byte[]{1})
                                        .build()
                                )
                                .build()
                )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @Transactional
    @DisplayName("첨부파일 제외 테스트")
    void removeFile_success() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Board hasFileBoard = getHasFileBoard(boardManagement, author);

        LocalDateTime modifiedAt = of(2026, 3, 3, 0, 0, 0);

        em.flush(); em.clear();

        log.info("hasFileBoard delete 전: {}", hasFileBoard.getBoardFiles().size()); // 1
        boardManagement.removeFile(
                author.getId(), hasFileBoard.getId(), hasFileBoard.getBoardFiles().getFirst().getId(), modifiedAt // 0
        );
        log.info("hasFileBoard delete 후 [ 메모리 ]: {}", hasFileBoard.getBoardFiles().size());

        em.flush(); em.clear();

        Board board = boardRepository.findById(hasFileBoard.getId()).orElseThrow();
        log.info("재조회 후 [ DB ]: {}", board.getBoardFiles().size()); // 1

        assertThat(board.getBoardFiles()).isEmpty();
        assertThat(board.getModifiedAt()).isEqualTo(modifiedAt);
    }

    @Test
    @Transactional
    @DisplayName("첨부파일 제외 테스트 - 작성자가 아니라면 게시글 파일을 삭제할 수 없다.")
    void removeFile_by_not_author_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Board hasFileBoard = getHasFileBoard(boardManagement, author);
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "otherEmp");

        em.flush(); em.clear();

        assertThatThrownBy(() ->
                boardManagement.removeFile(
                        otherEmp.getId(), hasFileBoard.getId(), hasFileBoard.getBoardFiles().getFirst().getId(), LocalDateTime.of(2026,3,3,0,0,0) // 0
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @Transactional
    @DisplayName("첨부파일 제외 테스트 - 수정일시가 없다면 실패")
    void removeFile_without_modifiedAt_fail() {
        Emp author = saveApprovedEmp(empRepository, "202601101", "author");
        Board hasFileBoard = getHasFileBoard(boardManagement, author);

        em.flush(); em.clear();

        assertThatThrownBy(() ->
                boardManagement.removeFile(
                        author.getId(), hasFileBoard.getId(), hasFileBoard.getBoardFiles().getFirst().getId(), null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    private Board getHasFileBoard(BoardManagement boardManagement, Emp author) {
        Emp admin = saveAdmin(empRepository);
        long categoryId = getSavedCategory(categoryManagement, admin, "category1");
        long publishedBoard = getPublishedBoard(boardManagement, author, categoryId);
        String fileName = "test.pdf";
        String mimeType = "application/pdf";
        long fileSize = 20 * 1024 * 1024L;
        LocalDateTime modifiedAt = of(2026, 3, 2, 0, 0, 0);

        boardManagement.addFile(
                author.getId(),
                publishedBoard,
                BoardFileRequest.builder()
                        .file(FileDto.builder()
                                .mimeType(mimeType)
                                .originalFileFullName(fileName)
                                .fileSize(fileSize)
                                .bytes(new byte[]{1})
                                .build()
                        )
                        .modifiedAt(modifiedAt)
                        .build()
        );

        return boardRepository.findById(publishedBoard).orElseThrow();
    }
}
