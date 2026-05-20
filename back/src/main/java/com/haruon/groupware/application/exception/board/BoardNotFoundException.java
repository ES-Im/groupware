package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class BoardNotFoundException extends ApplicationException {
    public BoardNotFoundException() {
        super(ApplicationErrorCode.BOARD_NOT_FOUND_EXCEPTION);
    }
}
