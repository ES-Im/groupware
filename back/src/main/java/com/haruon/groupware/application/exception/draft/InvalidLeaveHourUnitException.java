package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidLeaveHourUnitException extends ApplicationException {
    public InvalidLeaveHourUnitException() {
        super(ApplicationErrorCode.INVALID_LEAVE_HOUR_UNIT_EXCEPTION);
    }
}