package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EditForbiddenScheduleException extends ApplicationException {
    public EditForbiddenScheduleException() {
        super(ErrorCode.EDIT_FORBIDDEN_SCHEDULE_EXCEPTION);
    }
}
