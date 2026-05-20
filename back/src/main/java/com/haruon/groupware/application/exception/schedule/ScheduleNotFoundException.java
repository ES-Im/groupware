package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ScheduleNotFoundException extends ApplicationException {
    public ScheduleNotFoundException() {
        super(ApplicationErrorCode.SCHEDULE_NOT_FOUND_EXCEPTION);
    }
}
