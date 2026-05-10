package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class BoardNotFoundException extends ApplicationException {
    public BoardNotFoundException() {
        super(ErrorCode.BOARD_NOT_FOUND_EXCEPTION);
    }
}
