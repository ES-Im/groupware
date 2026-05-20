package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class AttendanceEmpMismatchException extends ApplicationException {
    public AttendanceEmpMismatchException() {
        super(ApplicationErrorCode.ATTENDANCE_EMP_MISMATCH_EXCEPTION);
    }
}