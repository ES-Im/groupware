package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class UnsupportedLeaveTypeException extends ApplicationException {
    public UnsupportedLeaveTypeException() {
        super(ErrorCode.UNSUPPORTED_LEAVE_BALANCE_TYPE_EXCEPTION);
    }
}