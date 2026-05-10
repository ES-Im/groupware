package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = "emp")
public class BoardLike extends AbstractEntity {

    private Board board;

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
