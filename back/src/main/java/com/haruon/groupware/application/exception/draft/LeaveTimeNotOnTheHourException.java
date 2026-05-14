package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class LeaveTimeNotOnTheHourException extends ApplicationException {
    public LeaveTimeNotOnTheHourException() {
        super(ApplicationErrorCode.LEAVE_TIME_NOT_ON_THE_HOUR_EXCEPTION);
    }
}
