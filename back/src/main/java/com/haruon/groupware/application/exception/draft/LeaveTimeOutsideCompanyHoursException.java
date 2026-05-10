package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class LeaveTimeOutsideCompanyHoursException extends ApplicationException {
    public LeaveTimeOutsideCompanyHoursException() {
        super(ErrorCode.LEAVE_TIME_OUTSIDE_COMPANY_HOURS_EXCEPTION);
    }
}
