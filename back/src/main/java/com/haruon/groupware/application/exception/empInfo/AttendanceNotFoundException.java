package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class AttendanceNotFoundException extends ApplicationException {
    public AttendanceNotFoundException() {
        super(ApplicationErrorCode.ATTENDANCE_NOT_FOUND_EXCEPTION);
    }
}
