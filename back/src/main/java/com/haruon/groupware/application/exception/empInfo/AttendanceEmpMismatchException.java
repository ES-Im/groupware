package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class AttendanceEmpMismatchException extends ApplicationException {
    public AttendanceEmpMismatchException() {
        super(ErrorCode.ATTENDANCE_EMP_MISMATCH_EXCEPTION);
    }
}