package com.haruon.groupware.application.exception.employee.emp;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidResignDateException extends ApplicationException {
    public InvalidResignDateException() {
        super(ApplicationErrorCode.INVALID_RESIGN_DATE_EXCEPTION);
    }
}
