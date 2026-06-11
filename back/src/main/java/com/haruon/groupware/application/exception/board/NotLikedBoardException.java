package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class NotLikedBoardException extends ApplicationException {
    public NotLikedBoardException() {
        super(ApplicationErrorCode.NOT_LIKED_BOARD_EXCEPTION);
    }
}