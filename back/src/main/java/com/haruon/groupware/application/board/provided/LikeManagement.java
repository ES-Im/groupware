package com.haruon.groupware.application.board.provided;

public interface LikeManagement {

    void like(Long boardId, Long empId);

    void unlike(Long boardId, Long empId);

}
