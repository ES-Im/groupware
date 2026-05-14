package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class PastTimeNotAllowedException extends ApplicationException {
    public PastTimeNotAllowedException() {
        super(ApplicationErrorCode.PAST_TIME_NOT_ALLOWED_EXCEPTION);
    }
}
