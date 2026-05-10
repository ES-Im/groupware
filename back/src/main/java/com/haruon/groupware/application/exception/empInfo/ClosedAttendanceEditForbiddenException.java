package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ClosedAttendanceEditForbiddenException extends ApplicationException {
    public ClosedAttendanceEditForbiddenException() {
        super(ErrorCode.CLOSED_ATTENDANCE_EDIT_FORBIDDEN_EXCEPTION);
    }
}
