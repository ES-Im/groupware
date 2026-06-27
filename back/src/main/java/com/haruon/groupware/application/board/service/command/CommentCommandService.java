package com.haruon.groupware.application.board.service.command;

import com.haruon.groupware.application.board.provided.forCommand.BoardReactionCounter;
import com.haruon.groupware.application.board.provided.forCommand.CommentManagement;
import com.haruon.groupware.application.board.required.BoardCommentRepository;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.board.BoardCommentNotFoundException;
import com.haruon.groupware.application.exception.board.BoardNotFoundException;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.BoardComment;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.board.service.support.BoardUtils.findBoard;
import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentCommandService implements CommentManagement {

    private final BoardRepository boardRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final BoardReactionCounter boardReactionCounter;
    private final EmpRepository empRepository;

    @Override
    public long registerComment(Long editorId, Long boardId, String content, LocalDateTime registerAt) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        Board board = findPublishedBoard(boardId);

        BoardComment comment = BoardComment.createComment(board, editor, content, registerAt);

        boardReactionCounter.increaseCommentCount(boardId);

        return boardCommentRepository.save(comment).getId();
    }

    @Override
    public long registerReply(
            Long editorId, Long boardId, Long parentCommentId, String content, LocalDateTime registerAt
    ) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        Board board = findPublishedBoard(boardId);
        BoardComment parentComment = findCommentInBoard(parentCommentId, board);

        BoardComment reply = BoardComment.createReply(board, editor, content, parentComment, registerAt);
        boardReactionCounter.increaseCommentCount(boardId);

        return boardCommentRepository.save(reply).getId();
    }

    @Override
    public void updateComment(
            Long editorId, Long boardId, Long commentId, String content, LocalDateTime modifiedAt
    ) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        Board board = findPublishedBoard(boardId);
        BoardComment comment = findCommentInBoard(commentId, board);

        comment.editComment(editor, content, modifiedAt);
    }

    @Override
    public void deleteComment(Long editorId, Long boardId, Long commentId) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        Board board = findPublishedBoard(boardId);
        BoardComment comment = findCommentInBoard(commentId, board);

        comment.deleteComment(editor);
        boardReactionCounter.decreaseCommentCount(boardId);
    }

    private Board findPublishedBoard(Long boardId) {
        Board board = findBoard(boardRepository, boardId);
        if(board.isDraft()) throw new BoardNotFoundException();

        return board;
    }

    private BoardComment findCommentInBoard(Long commentId, Board board) {
        BoardComment comment = boardCommentRepository.findById(commentId)
                .orElseThrow(BoardCommentNotFoundException::new);

        if(!comment.getBoard().equals(board)) throw new BoardCommentNotFoundException();

        return comment;
    }
}
