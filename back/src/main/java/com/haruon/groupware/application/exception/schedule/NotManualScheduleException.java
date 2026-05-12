package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class NotManualScheduleException extends ApplicationException {
    public NotManualScheduleException() {
        super(ErrorCode.NOT_MANUAL_SCHEDULE_EXCEPTION);
    }
}
