package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.board.BoardComment.createComment;
import static com.haruon.groupware.domain.board.BoardTest.getBoard;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class BoardCommentTest {


    @Test
    @DisplayName("발행된 게시글에만 댓글을 작성할 수 있다.")
    void createComment_only_for_published_board() {
        Board publishedBoard = getBoard(false);

        Emp commenter = getApprovedEmp("202604001", "login04001");

        LocalDateTime commentRegisterAt = publishedBoard.getPublishedAt().plusDays(1);
        String content = "test";
        BoardComment comment = createComment(
                publishedBoard, commenter, content, commentRegisterAt
        );

        assertThat(comment).extracting(
                BoardComment::getBoard, BoardComment::getEmp,
                BoardComment::getContent, BoardComment::getRegisterAt
        ).containsExactly(
                publishedBoard, commenter, content, commentRegisterAt
        );

        assertFalse(comment.isDeleted());
        assertNull(comment.getParentComment());
        assertNull(comment.getEditedAt());
    }

    @Test
    @DisplayName("발행되지 않은 게시글에는 댓글을 달 수 없다.")
    void createComment_for_unpublished_board_fail() {
        Board unpublishedBoard = getBoard(true);
        unpublishedBoard.publish(unpublishedBoard.getEmp(), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        ReflectionTestUtils.setField(unpublishedBoard, "publishedAt", null);

        Emp commenter = getApprovedEmp("202604001", "login04001");
        LocalDateTime commentRegisterAt = LocalDateTime.of(2027, 1, 1, 0,0,0);
        String content = "test";

        assertThatThrownBy(() ->
            createComment(
                    unpublishedBoard, commenter, content, commentRegisterAt
            )
        ).hasMessage("발행 전 게시글에 댓글을 남길 수 없음");
    }

    @Test
    @DisplayName("게시글 발행시간보다 댓글 작성시간이 이를 수 없음")
    void createComment_before_publishedAt_fail() {
        Board board = getBoard(false);

        Emp commenter = getApprovedEmp("202604001", "login04001");
        LocalDateTime commentRegisterAt = board.getPublishedAt().minusNanos(1);
        String content = "test";

        assertThatThrownBy(() ->
                createComment(
                        board, commenter, content, commentRegisterAt
                )
        ).hasMessage("게시글 발행시간보다 댓글 작성시간이 이를 수 없음");
    }

    @Test
    @DisplayName("삭제되지 않은 댓글에 대댓글을 달 수 있다.")
    void createReply() {
        BoardComment parentComment = getParentComment();

        Board board = parentComment.getBoard();
        Emp replier = getApprovedEmp("202604002", "login04002");
        String content = "test";
        LocalDateTime registerAt = parentComment.getRegisterAt().plusHours(1);

        BoardComment reply = BoardComment.createReply(
                board, replier, content, parentComment, registerAt
        );


        assertThat(reply).extracting(
                BoardComment::getBoard, BoardComment::getEmp,
                BoardComment::getContent, BoardComment::getRegisterAt,
                BoardComment::getParentComment
        ).containsExactly(
                board, replier, content, registerAt,
                parentComment
        );

        assertFalse(reply.isDeleted());
        assertNull(reply.getEditedAt());
    }

    @Test
    @DisplayName("삭제된 댓글에 대댓글을 달 수 없다.")
    void createReply_for_deleted_comment_fail() {
        BoardComment parentComment = getParentComment();
        parentComment.deleteComment(parentComment.getEmp());

        assertThatThrownBy(() ->
                BoardComment.createReply(
                        parentComment.getBoard(), getApprovedEmp("202604002", "login04002"), "test", parentComment, parentComment.getRegisterAt().plusHours(1)
                )
        ).hasMessage("삭제된 댓글에는 대댓글을 작성할 수 없음");
    }

    @Test
    @DisplayName("대댓글에는 대댓글을 달 수 없다")
    void createReply_for_reply_comment_fail() {
        BoardComment parentComment = getParentComment();

        Board board = parentComment.getBoard();

        BoardComment reply = BoardComment.createReply(
                board, getApprovedEmp("202604002", "login04002"), "test", parentComment, parentComment.getRegisterAt().plusHours(1)
        );

        assertThatThrownBy(() ->
                BoardComment.createReply(
                        board, getApprovedEmp("202604003", "login4003"), "content", reply, reply.getRegisterAt().plusHours(1)
                )
        ).hasMessage("대댓글에는 다시 대댓글을 작성할 수 없음");
    }

    @Test
    @DisplayName("댓글과 대댓글의 게시물이 다르면 실패")
    void createReply_for_different_board_fail() {
        BoardComment parentComment = getParentComment();

        Board otherBoard = Board.create(
                parentComment.getBoard().getEmp(), parentComment.getBoard().getCategory(),
                "otherTitle", "other",
                false,
                LocalDateTime.of(2026, 3, 1, 0, 0, 0)
        );

        assertThatThrownBy(() ->
                BoardComment.createReply(
                        otherBoard, getApprovedEmp("202604003", "login4003"), "content", parentComment, otherBoard.getPublishedAt().plusHours(1)
                )
        ).hasMessage("부모 댓글과 게시글이 일치하지 않음");
    }

    @Test
    @DisplayName("댓글 작성자만 수정이 가능하다")
    void editComment() {
        BoardComment comment = getParentComment();

        Board board = comment.getBoard();
        Emp author = comment.getEmp();
        String content = "test";

        LocalDateTime editedAt = comment.getRegisterAt().plusHours(1);
        comment.editComment(
                author, content, editedAt
        );

        assertThat(comment).extracting(
                BoardComment::getBoard, BoardComment::getEmp,
                BoardComment::getContent, BoardComment::getEditedAt
        ).containsExactly(
                board, author, content, editedAt
        );
    }

    @Test
    @DisplayName("댓글 작성자가 아니라면 수정이 실패")
    void editComment_by_not_author_fail() {
        BoardComment comment = getParentComment();

        Emp otherAuthor = getApprovedEmp("202604003", "login4003");

        assertThatThrownBy(() ->
                comment.editComment(
                        otherAuthor, "content", comment.getRegisterAt().plusHours(1)
                )
        ).hasMessage("댓글 작성자만 수정/삭제 가능");
    }

    @Test
    @DisplayName("댓글 작성자만 삭제가 가능하다")
    void deleteComment() {
        BoardComment comment = getParentComment();

        Emp author = comment.getEmp();

        comment.deleteComment(author);

        assertThat(comment.isDeleted()).isTrue();
    }

    @Test
    @DisplayName("댓글 작성자가 아니라면 삭제이 실패")
    void deleteComment_by_not_author_fail() {
        BoardComment comment = getParentComment();

        Emp otherAuthor = getApprovedEmp("202604003", "login4003");

        assertThatThrownBy(() ->
                comment.deleteComment(
                        otherAuthor
                )
        ).hasMessage("댓글 작성자만 수정/삭제 가능");
    }




    private @NonNull BoardComment getParentComment() {
        Board publishedBoard = getBoard(false);

        Emp commenter = getApprovedEmp("202604001", "login04001");

        LocalDateTime commentRegisterAt = publishedBoard.getPublishedAt().plusDays(1);
        String content = "test";
        return createComment(
                publishedBoard, commenter, content, commentRegisterAt
        );
    }
}