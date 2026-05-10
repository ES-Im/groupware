package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EndTimeBeforeStartTimeException extends ApplicationException {
    public EndTimeBeforeStartTimeException() {
        super(ErrorCode.END_TIME_BEFORE_START_TIME_EXCEPTION);
    }
}
