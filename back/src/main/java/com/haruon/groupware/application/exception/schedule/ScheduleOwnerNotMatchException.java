package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ScheduleOwnerNotMatchException extends ApplicationException {
    public ScheduleOwnerNotMatchException() {
        super(ApplicationErrorCode.SCHEDULE_OWNER_NOT_MATCH_EXCEPTION);
    }
}
