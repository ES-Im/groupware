package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EndTimeBeforeStartTimeException extends ApplicationException {
    public EndTimeBeforeStartTimeException() {
        super(ApplicationErrorCode.END_TIME_BEFORE_START_TIME_EXCEPTION);
    }
}
