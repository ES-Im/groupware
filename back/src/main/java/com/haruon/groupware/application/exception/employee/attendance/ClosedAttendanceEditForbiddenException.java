package com.haruon.groupware.application.exception.employee.attendance;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ClosedAttendanceEditForbiddenException extends ApplicationException {
    public ClosedAttendanceEditForbiddenException() {
        super(ApplicationErrorCode.CLOSED_ATTENDANCE_EDIT_FORBIDDEN_EXCEPTION);
    }
}
