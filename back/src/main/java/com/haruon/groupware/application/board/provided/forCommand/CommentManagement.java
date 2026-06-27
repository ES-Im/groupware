package com.haruon.groupware.application.board.provided.forCommand;

import java.time.LocalDateTime;

public interface CommentManagement {

    long registerComment(Long editorId, Long boardId, String content, LocalDateTime registerAt);

    long registerReply(Long editorId, Long boardId, Long parentCommentId, String content, LocalDateTime registerAt);

    void updateComment(Long editorId, Long boardId, Long commentId, String content, LocalDateTime modifiedAt);

    void deleteComment(Long editorId, Long boardId, Long commentId);

}
