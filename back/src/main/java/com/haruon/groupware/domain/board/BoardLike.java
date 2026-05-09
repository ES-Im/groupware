package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "emp_id"}))
public class BoardLike extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    public static BoardLike create(Board board, Emp emp) {
        validateMarkable(board, emp);

        BoardLike boardLike = new BoardLike();

        boardLike.board = board;
        boardLike.emp = emp;

        return boardLike;
    }

    private static void validateMarkable(Board board, Emp emp) {
        requireNonNull(board);
        requireNonNull(emp);

        state(!board.isDraft(), "발행된 게시글 대상으로만 좋아요 표시 가능");
    }

}
