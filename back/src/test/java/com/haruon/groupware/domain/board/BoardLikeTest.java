package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.domain.board.BoardTest.getBoard;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BoardLikeTest {

    @Test
    @DisplayName("발행된 게시글 대상으로 좋아요가 가능")
    void create_success() {
        Board publishedBoard = getBoard(false);

        Emp emp = getApprovedEmp("202604001", "login04001");
        BoardLike boardLike = BoardLike.create(
                publishedBoard, emp
        );

        assertThat(boardLike).extracting(
                BoardLike::getBoard, BoardLike::getEmp
        ).containsExactly(
                publishedBoard, emp
        );
    }

    @Test
    @DisplayName("발행되지 않은 게시글 대상으로 좋아요가 불가능")
    void create_fail() {
        Board publishedBoard = getBoard(true);

        Emp emp = getApprovedEmp("202604001", "login04001");

        assertThatThrownBy(() ->
                BoardLike.create(
                        publishedBoard, emp
                )
        ).hasMessage("발행된 게시글 대상으로만 좋아요 표시 가능");
    }

}