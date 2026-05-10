package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class AttendanceNotFoundException extends ApplicationException {
    public AttendanceNotFoundException() {
        super(ErrorCode.ATTENDANCE_NOT_FOUND_EXCEPTION);
    }
}
