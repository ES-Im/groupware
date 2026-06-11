package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.BoardLike;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface BoardLikeRepository extends Repository<BoardLike, Long> {

    void save(BoardLike boardLike);

    void delete(BoardLike boardLike);

    boolean existsByBoardIdAndEmpId(Long boardId, Long empId);

    Optional<BoardLike> findByBoardIdAndEmpId(Long boardId, Long empId);
}
