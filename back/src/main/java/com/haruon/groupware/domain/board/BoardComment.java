package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = {"emp", "board", "parentComment"})
public class BoardComment extends AbstractEntity {

    private Board board;

    private Emp emp;

    @Nullable private BoardComment parentComment;

    private String content;

    private LocalDateTime registerAt;

    @Nullable private LocalDateTime editedAt;

    private boolean isDeleted;

    public static BoardComment createComment(
            Board board,
            Emp emp,
            String content,
            LocalDateTime registerAt
    ) {
        requireNonNull(board);
        requireNonNull(registerAt);

        state(board.isDraft() || board.getPublishedAt() != null, "발행 전 게시글에 댓글을 남길 수 없음");
        state(board.getPublishedAt().isBefore(registerAt), "게시글 발행시간보다 댓글 작성시간이 이를 수 없음");

        BoardComment comment = new BoardComment();

        comment.board = board;
        comment.emp = requireNonNull(emp);
        comment.content = requireNonNull(content);
        comment.registerAt = registerAt;
        comment.isDeleted = false;

        return comment;
    }

    public static BoardComment createReply(
            Board board,
            Emp emp,
            String content,
            BoardComment parentComment,
            LocalDateTime registerAt
    ) {
        requireNonNull(parentComment);
        validateReplyable(board, parentComment);
        state(parentComment.getRegisterAt().isBefore(registerAt), "대댓글은 댓글보다 이르게 작성할 수 없음");

        BoardComment reply = new BoardComment();

        reply.board = requireNonNull(board);
        reply.emp = requireNonNull(emp);
        reply.content = requireNonNull(content);
        reply.parentComment = parentComment;
        reply.isDeleted = false;
        reply.registerAt = requireNonNull(registerAt);

        return reply;
    }

    public void editComment(Emp author, String content, LocalDateTime editedAt) {
        stateNotDeleted();
        validateAuthor(author);

        this.content = requireNonNull(content);
        this.editedAt = requireNonNull(editedAt);
    }


    public void deleteComment(Emp author) {
        stateNotDeleted();
        validateAuthor(author);

        this.isDeleted = true;
    }

    private static void validateReplyable(Board board, BoardComment parentComment) {
        state(!parentComment.isDeleted(), "삭제된 댓글에는 대댓글을 작성할 수 없음");
        state(!parentComment.isReply(), "대댓글에는 다시 대댓글을 작성할 수 없음");

        if (!parentComment.board.equals(board)) {
            throw new IllegalArgumentException("부모 댓글과 게시글이 일치하지 않음");
        }
    }

    private boolean isReply() {
        return this.parentComment != null;
    }

    private void stateNotDeleted() {
        state(!isDeleted, "삭제된 댓글은 수정/삭제할 수 없음");
    }


    private void validateAuthor(Emp author) {
        state(this.emp.equals(author), "댓글 작성자만 수정/삭제 가능");
    }
}
