package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.BoardComment;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoardCommentRepository extends Repository<BoardComment, Long> {

    BoardComment save(BoardComment boardComment);

    Optional<BoardComment> findById(Long commentId);

    void deleteAll();

    @Modifying
    @Query("""
        delete from BoardComment bc
         where bc.board.id = :boardId
           and bc.parentComment is not null
    """)
    int deleteRepliesByBoardId(@Param("boardId") Long boardId);

    @Modifying
    @Query("""
        delete from BoardComment bc
         where bc.board.id = :boardId
           and bc.parentComment is null
    """)
    int deleteRootCommentsByBoardId(@Param("boardId") Long boardId);
}
