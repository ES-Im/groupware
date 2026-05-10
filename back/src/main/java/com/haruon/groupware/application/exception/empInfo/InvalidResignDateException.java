package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InvalidResignDateException extends ApplicationException {
    public InvalidResignDateException() {
        super(ErrorCode.INVALID_RESIGN_DATE_EXCEPTION);
    }
}
