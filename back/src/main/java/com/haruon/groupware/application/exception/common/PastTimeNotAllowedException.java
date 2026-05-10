package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class PastTimeNotAllowedException extends ApplicationException {
    public PastTimeNotAllowedException() {
        super(ErrorCode.PAST_TIME_NOT_ALLOWED_EXCEPTION);
    }
}
