package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidPasswordException extends ApplicationException {
    public InvalidPasswordException() {
        super(ApplicationErrorCode.INVALID_PASSWORD_EXCEPTION);
    }
}