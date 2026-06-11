package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class AlreadyLikedBoardException extends ApplicationException {
    public AlreadyLikedBoardException() {
        super(ApplicationErrorCode.ALREADY_LIKED_BOARD_EXCEPTION);
    }
}