package com.haruon.groupware.application.board.provided;

public interface BoardReactionCounter {

    void increaseViewCount(Long boardId, int count);

    void increaseLikeCount(Long boardId, int count);

    void decreaseLikeCount(Long boardId, int count);

    void increaseCommentCount(Long boardId, int count);

    void decreaseCommentCount(Long boardId, int count);

}