package com.haruon.groupware.application.board.provided;

import java.time.LocalDateTime;

public interface CommentManagement {

    long registerComment(Long editorId, Long boardId, String content, LocalDateTime registerAt);

    long registerReply(Long editorId, Long commentId, String content, LocalDateTime registerAt);

    void updateComment(Long editorId, Long commentId, String content, LocalDateTime modifiedAt);

    void deleteComment(Long editorId, Long commentId);

}
