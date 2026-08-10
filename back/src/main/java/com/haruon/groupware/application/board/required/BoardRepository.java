package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.Board;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoardRepository extends Repository<Board, Long> {
    Board save(Board board);

    Optional<Board> findById(Long id);

    void deleteAll();

    boolean existsBoardById(Long boardId);

    /**
     * return 1 (DB 반영 성공) 0 (DB반영 실패)
     */
    @Modifying
    @Query("""
        update Board b
           set b.viewCount = b.viewCount + :viewCount,
               b.commentCount = b.commentCount + :commentCount,
               b.likeCount = b.likeCount + :likeCount
         where b.id = :boardId
    """)
    int updateReactionDeltaToBoard(
            @Param("boardId") Long boardId,
            @Param("viewCount") Long viewCount,
            @Param("commentCount") Long commentCount,
            @Param("likeCount") Long likeCount
    );

    void delete(Board board);
}
