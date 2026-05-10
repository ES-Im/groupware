package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class LeaveTimeNotOnTheHourException extends ApplicationException {
    public LeaveTimeNotOnTheHourException() {
        super(ErrorCode.LEAVE_TIME_NOT_ON_THE_HOUR_EXCEPTION);
    }
}
