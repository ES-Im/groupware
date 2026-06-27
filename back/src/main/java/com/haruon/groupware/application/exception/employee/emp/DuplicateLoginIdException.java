package com.haruon.groupware.application.exception.employee.emp;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DuplicateLoginIdException extends ApplicationException {
    public DuplicateLoginIdException() {
        super(ApplicationErrorCode.DUPLICATE_LOGIN_ID_EXCEPTION);
    }
}