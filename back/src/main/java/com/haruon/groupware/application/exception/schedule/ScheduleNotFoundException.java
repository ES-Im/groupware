package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ScheduleNotFoundException extends ApplicationException {
    public ScheduleNotFoundException() {
        super(ErrorCode.SCHEDULE_NOT_FOUND_EXCEPTION);
    }
}
