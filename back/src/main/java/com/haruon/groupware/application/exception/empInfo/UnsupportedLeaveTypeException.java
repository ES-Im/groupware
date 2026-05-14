package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnsupportedLeaveTypeException extends ApplicationException {
    public UnsupportedLeaveTypeException() {
        super(ApplicationErrorCode.UNSUPPORTED_LEAVE_BALANCE_TYPE_EXCEPTION);
    }
}