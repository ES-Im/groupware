package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EditForbiddenScheduleException extends ApplicationException {
    public EditForbiddenScheduleException() {
        super(ApplicationErrorCode.EDIT_FORBIDDEN_SCHEDULE_EXCEPTION);
    }
}
