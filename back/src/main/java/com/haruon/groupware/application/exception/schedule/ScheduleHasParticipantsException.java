package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ScheduleHasParticipantsException extends ApplicationException {
    public ScheduleHasParticipantsException() {
        super(ApplicationErrorCode.SCHEDULE_HAS_PARTICIPANTS_EXCEPTION);
    }
}
