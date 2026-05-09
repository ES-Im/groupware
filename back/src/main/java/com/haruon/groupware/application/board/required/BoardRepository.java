package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.Board;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface BoardRepository extends Repository<Board, Long> {
    Board save(Board board);

    Optional<Board> findById(Long id);

    void deleteAll();
}
