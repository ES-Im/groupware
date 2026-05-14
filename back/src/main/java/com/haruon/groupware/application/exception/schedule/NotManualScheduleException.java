package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class NotManualScheduleException extends ApplicationException {
    public NotManualScheduleException() {
        super(ApplicationErrorCode.NOT_MANUAL_SCHEDULE_EXCEPTION);
    }
}
