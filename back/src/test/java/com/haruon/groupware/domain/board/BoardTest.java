package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertNull;

class BoardTest {

    @Test
    @DisplayName("게시글 생성 시 author, category, title, content, is_draft는 필수다.")
    void create_success() {
        Emp emp = getApprovedEmp();
        String title = "testTitle";
        String content = "testContent";
        Category category = Category.create("testCategory");
        boolean isDraft = true;

        Board board = Board.create(
                emp, category, title, content, isDraft, null
        );

        assertThat(board).extracting(
                Board::getEmp, Board::getCategory, Board::getTitle, Board::getContent, Board::isDraft
        ).containsExactly(
                emp, category, title, content, isDraft
        );

        assertThat(board.getViewCount())
                .as("게시글 생성시 조회수는 0")
                .isZero();

        assertThat(board.getLikeCount())
                .as("게시글 생성시 좋아요는 0")
                .isZero();

        assertThat(board.getCommentCount())
                .as("게시글 생성시 댓글수는 0")
                .isZero();

        assertNull(board.getPublishedAt());
        assertNull(board.getModifiedAt());
    }

    @Test
    @DisplayName("게시글 생성과 함께 발행시, 발행시각을 입력하지 않으면 실패한다.")
    void create_published_board_without_publishedAt_fail() {
        boolean isDraft = false;

        assertThatThrownBy(() ->
                Board.create(
                        getApprovedEmp(), Category.create("testCategory"), "testTitle", "testContent", isDraft, null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("게시글 수정 시, 게시글작성자만 수정할 수 있으며, 수정할 내용이 하나라도 있어야한다.")
    void changeBoard_success() {
        Emp author = getApprovedEmp();
        String editedTitle = "edited_testTitle";
        String editedContent = "edited_testContent";
        Category editedCategory = Category.create("edited_testCategory");
        boolean isDraft = true;

        Board board = getBoard(author, isDraft);

        board.changeBoard(author, editedCategory, editedTitle, editedContent, null);

        assertThat(board).extracting(
                Board::getCategory, Board::getTitle, Board::getContent
        ).containsExactly(
                editedCategory, editedTitle, editedContent
        );
    }

    @Test
    @DisplayName("발행된 게시글 수정 시, 수정일시가 있어야한다.")
    void changeBoard_after_publish_success() {
        Emp author = getApprovedEmp();
        boolean isDraft = false;

        Board board = getBoard(author, isDraft);
        LocalDateTime modifiedAt = board.getPublishedAt().plusDays(1);

        board.changeBoard(author, Category.create("edited_testCategory"), "edited_testTitle", "edited_testContent", modifiedAt);

        assertThat(board.isDraft()).isFalse();
        assertThat(board.getModifiedAt()).isEqualTo(modifiedAt);
    }

    @Test
    @DisplayName("게시글 수정 시, 수정할 내용이 하나라도 없으면 실패한다.")
    void changeBoard_without_editable_instance_fail() {
        Emp author = getApprovedEmp();

        Board board = getBoard(author, true);

        assertThatThrownBy(() ->
                board.changeBoard(author, null, null, null, null)
        ).hasMessage("수정할 내용이 없음");
    }

    @Test
    @DisplayName("게시글 수정 시, 활성화되어있지 않은 카테고리를 선택하면 실패한다.")
    void changeBoard_with_inactive_category_fail() {
        Emp author = getApprovedEmp();

        Board board = getBoard(author, true);
        Category inactiveCategory = Category.create("inactive_testCategory");
        inactiveCategory.changeVisibility(false);

        assertThatThrownBy(() ->
                board.changeBoard(author, inactiveCategory, null, null, null)
        ).hasMessage("활성화된 카테고리만 이용가능");
    }

    @Test
    @DisplayName("게시글 수정 시, 작성자가 아니라면 실패한다.")
    void changeBoard_by_not_author_fail() {
        Emp author = getApprovedEmp();

        Emp notAuthor = getApprovedEmp("202601002", "login2");
        Board board = getBoard(author, true);

        assertThatThrownBy(() ->
                board.changeBoard(notAuthor, Category.create("edited_testCategory"), "edited_testTitle", "edited_testContent", null)
        ).hasMessage("작성자만 수정/발행가능");
    }

    @Test
    @DisplayName("발행 이후 게시글 수정 시, 수정일시가 없으면 실패한다.")
    void changeBoard_after_published_without_modifiedAt_fail() {
        Emp author = getApprovedEmp();

        Board board = getBoard(author, false);

        assertThatThrownBy(() ->
                board.changeBoard(author,
                        Category.create("edited_testCategory"),
                        "edited_testTitle",
                        "edited_testContent", null)
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("발행 이후 게시글 수정 시, 발행일시보다 수정일시가 이르면 실패한다.")
    void changeBoard_after_published_with_modifiedAt_before_publishedAt_fail() {
        Emp author = getApprovedEmp();

        Board board = getBoard(author, false);

        LocalDateTime wrongPublishedAt = board.getPublishedAt().minusMinutes(1);

        assertThatThrownBy(() ->
                board.changeBoard(author,
                        Category.create("edited_testCategory"),
                        "edited_testTitle",
                        "edited_testContent", wrongPublishedAt)
        ).hasMessage("수정시각이 발행시각보다 이를 수 없음");
    }

    @Test
    @DisplayName("작성자는 임시저장된 게시글을 발행할 수 있다.")
    void publish_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, true);

        LocalDateTime publishedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
        board.publish(author, publishedAt);

        assertThat(board.getPublishedAt()).isEqualTo(publishedAt);
        assertThat(board.isDraft()).isFalse();
    }

    @Test
    @DisplayName("작성자가 아니라면 임시저장된 게시글을 발행할 수 없다")
    void publish_by_not_author_fail() {
        Emp author = getApprovedEmp();
        Emp notAuthor = getApprovedEmp("202601002", "login2");
        Board board = getBoard(author, true);

        assertThatThrownBy(() ->
                board.publish(notAuthor, LocalDateTime.of(2026, 1, 1, 0, 0, 0))
        ).hasMessage("작성자만 수정/발행가능");
    }

    @Test
    @DisplayName("발행된 게시글 대상으로 count증가/감소 가능")
    void increaseViewCount_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, false);

        board.increaseCommentCount(1);
        board.increaseLikeCount(1);
        board.increaseViewCount(1);

        assertThat(board.getCommentCount()).isOne();
        assertThat(board.getLikeCount()).isOne();
        assertThat(board.getViewCount()).isOne();

        board.decreaseCommentCount(1);
        board.decreaseLikeCount(1);

        assertThat(board.getCommentCount()).isZero();
        assertThat(board.getLikeCount()).isZero();
    }

    @Test
    @DisplayName("발행된 게시글이 아니면 count증가/감소 실패")
    void increaseViewCount_before_published_fail() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, true);

        assertThatThrownBy(() ->
                board.increaseCommentCount(1)
        ).hasMessage("발행되지 않은 게시글");

        assertThatThrownBy(() ->
                board.increaseLikeCount(1)
        ).hasMessage("발행되지 않은 게시글");

        assertThatThrownBy(() ->
                board.increaseViewCount(1)
        ).hasMessage("발행되지 않은 게시글");

        assertThatThrownBy(() ->
                board.decreaseCommentCount(1)
        ).hasMessage("발행되지 않은 게시글");

        assertThatThrownBy(() ->
                board.decreaseLikeCount(1)
        ).hasMessage("발행되지 않은 게시글");
    }

    @Test
    @DisplayName("count증가/감소 값이 음수라면 실패")
    void increaseViewCount_when_count_is_negative_fail() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, false);

        assertThatThrownBy(() ->
                board.increaseCommentCount(-1)
        ).hasMessage("해당값은 음수가 될 수 없음");

        assertThatThrownBy(() ->
                board.increaseLikeCount(-1)
        ).hasMessage("해당값은 음수가 될 수 없음");

        assertThatThrownBy(() ->
                board.increaseViewCount(-1)
        ).hasMessage("해당값은 음수가 될 수 없음");

        assertThatThrownBy(() ->
                board.decreaseCommentCount(-1)
        ).hasMessage("해당값은 음수가 될 수 없음");

        assertThatThrownBy(() ->
                board.decreaseLikeCount(-1)
        ).hasMessage("해당값은 음수가 될 수 없음");
    }

    @Test
    @DisplayName("작성자는 게시글에 파일을 첨부 할 수 있으며, 발행전이라면 수정일시가 없어도 된다.")
    void addBoardFile_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, true);

        board.addBoardFile(author, "test", "test", "test", 1000L, null);

        assertThat(board.getBoardFiles().size()).isEqualTo(1);
    }

    @Test
    @DisplayName("작성자 외 사원은 파일 첨부를 할 수 없음")
    void addBoardFile_by_not_author_fail() {
        Emp author = getApprovedEmp();
        Emp notAuthor = getApprovedEmp("202601002", "login2");
        Board board = getBoard(author, true);

        assertThatThrownBy(() ->
                board.addBoardFile(notAuthor, "test", "test", "test", 1000L, null)
        ).hasMessage("작성자만 수정/발행가능");

    }

    @Test
    @DisplayName("작성자는 게시글에 파일을 첨부 할 수 있으며, 발행 후라면 수정일시가 필수")
    void addBoardFile_after_published_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, false);
        LocalDateTime modifiedAt = board.getPublishedAt().plusDays(1);

        board.addBoardFile(author, "test", "test", "test", 1000L, modifiedAt);

        assertThat(board.getBoardFiles().size()).isEqualTo(1);
        assertThat(board.getModifiedAt()).isEqualTo(modifiedAt);
    }

    @Test
    @DisplayName("작성자는 게시글에 파일을 첨부 할 수 있으며, 발행 후 수정일시가 없다면 실패")
    void addBoardFile_after_published_without_modifiedAt_fail() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, false);
        LocalDateTime modifiedAt = null;

        assertThatThrownBy(() ->
                board.addBoardFile(author, "test", "test", "test", 1000L, modifiedAt)
        ).isInstanceOf(NullPointerException.class);
    }


    @Test
    @DisplayName("작성자는 게시글에 첨부파일을 삭제 할 수 있으며, 발행전이라면 수정일시가 없어도 된다.")
    void remove_BoardFile_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, true);

        board.addBoardFile(author, "test", "test", "test", 1000L, null);
        BoardFile first = board.getBoardFiles().getFirst();
        ReflectionTestUtils.setField(first, "id", 1L);

        board.removeBoardFile(author, 1L, null);

        assertThat(board.getBoardFiles().size()).isEqualTo(0);
    }

    @Test
    @DisplayName("작성자 외 사원은 첨부파일 삭제를 할 수 없음")
    void removeBoardFile_by_not_author_fail() {
        Emp author = getApprovedEmp();
        Emp notAuthor = getApprovedEmp("202601002", "login2");
        Board board = getBoard(author, true);
        board.addBoardFile(author, "test", "test", "test", 1000L, null);
        BoardFile first = board.getBoardFiles().getFirst();
        ReflectionTestUtils.setField(first, "id", 1L);

        assertThatThrownBy(() ->
                board.removeBoardFile(notAuthor, 1L, null)
        ).hasMessage("작성자만 수정/발행가능");

    }

    @Test
    @DisplayName("작성자는 게시글에 첨부파일을 삭제 할 수 있으며, 발행 후라면 수정일시가 필수")
    void remove_BoardFile_after_published_success() {
        Emp author = getApprovedEmp();
        Board board = getBoard(author, false);
        LocalDateTime modifiedAt = board.getPublishedAt().plusDays(1);
        board.addBoardFile(author, "test", "test", "test", 1000L, modifiedAt);

        BoardFile first = board.getBoardFiles().getFirst();
        ReflectionTestUtils.setField(first, "id", 1L);

        board.removeBoardFile(author, 1L, modifiedAt);

        assertThat(board.getBoardFiles().size()).isEqualTo(0);
        assertThat(board.getModifiedAt()).isEqualTo(modifiedAt);
    }

    private static @NonNull Board getBoard(Emp author, boolean isDraft) {
        LocalDateTime publishedAt = LocalDateTime.of(2026, 4, 1, 0, 0, 0);

        if(isDraft) publishedAt = null;

        return Board.create(
                author, Category.create("testCategory"), "testTitle", "testContent", isDraft, publishedAt
        );
    }

    static @NonNull Board getBoard(boolean isDraft) {
        return Board.create(
                getApprovedEmp(),
                Category.create("test"),
                "title", "content",
                isDraft, LocalDateTime.of(2026, 1, 1, 0, 0, 0)
        );
    }
}