package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ScheduleOwnerRemovalNotAllowedException extends ApplicationException {
    public ScheduleOwnerRemovalNotAllowedException() {
        super(ApplicationErrorCode.SCHEDULE_OWNER_REMOVAL_NOT_ALLOWED_EXCEPTION);
    }
}
