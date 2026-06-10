package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmpNotMatchAuthorException extends ApplicationException {
    public EmpNotMatchAuthorException() {
        super(ApplicationErrorCode.BOARD_NOT_FOUND_EXCEPTION);
    }
}
