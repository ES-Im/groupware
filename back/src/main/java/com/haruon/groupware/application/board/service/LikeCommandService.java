package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.provided.BoardReactionCounter;
import com.haruon.groupware.application.board.provided.LikeManagement;
import com.haruon.groupware.application.board.required.BoardLikeRepository;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.board.AlreadyLikedBoardException;
import com.haruon.groupware.application.exception.board.BoardNotFoundException;
import com.haruon.groupware.application.exception.board.NotLikedBoardException;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.BoardLike;
import com.haruon.groupware.domain.empInfo.Emp;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class LikeCommandService implements LikeManagement {

    private final BoardLikeRepository boardLikeRepository;
    private final BoardRepository boardRepository;
    private final EmpRepository empRepository;
    private final BoardReactionCounter boardReactionCounter;

    @Override
    public void like(Long boardId, Long empId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(BoardNotFoundException::new);
        Emp emp = AuthValidator.findActiveEmpById(empRepository, empId);

        if (boardLikeRepository.existsByBoardIdAndEmpId(boardId, empId)) {
            throw new AlreadyLikedBoardException();
        }

        BoardLike boardLike = BoardLike.create(board, emp);

        boardLikeRepository.save(boardLike);

        boardReactionCounter.increaseLikeCount(boardId);
    }

    @Override
    public void unlike(Long boardId, Long empId) {
        BoardLike boardLike = boardLikeRepository.findByBoardIdAndEmpId(boardId, empId)
                .orElseThrow(NotLikedBoardException::new);

        boardLikeRepository.delete(boardLike);

        boardReactionCounter.decreaseLikeCount(boardId);
    }
}
