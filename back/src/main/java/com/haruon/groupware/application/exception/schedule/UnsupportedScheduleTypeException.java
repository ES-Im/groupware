package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class UnsupportedScheduleTypeException extends ApplicationException {
    public UnsupportedScheduleTypeException() {
        super(ErrorCode.UNSUPPORTED_SCHEDULE_TYPE_EXCEPTION);
    }
}
