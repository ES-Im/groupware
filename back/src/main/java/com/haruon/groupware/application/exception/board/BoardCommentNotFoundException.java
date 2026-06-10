package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class BoardCommentNotFoundException extends ApplicationException {
    public BoardCommentNotFoundException() {
        super(ApplicationErrorCode.BOARD_COMMENT_NOT_FOUND_EXCEPTION);
    }
}
