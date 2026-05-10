package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InvalidLeaveHourUnitException extends ApplicationException {
    public InvalidLeaveHourUnitException() {
        super(ErrorCode.INVALID_LEAVE_HOUR_UNIT_EXCEPTION);
    }
}