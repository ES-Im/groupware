package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnsupportedScheduleTypeException extends ApplicationException {
    public UnsupportedScheduleTypeException() {
        super(ApplicationErrorCode.UNSUPPORTED_SCHEDULE_TYPE_EXCEPTION);
    }
}
