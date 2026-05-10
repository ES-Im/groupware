package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DuplicateLoginIdException extends ApplicationException {
    public DuplicateLoginIdException() {
        super(ErrorCode.DUPLICATE_LOGIN_ID_EXCEPTION);
    }
}