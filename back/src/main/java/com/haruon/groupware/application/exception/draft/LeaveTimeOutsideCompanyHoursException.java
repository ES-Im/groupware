package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class LeaveTimeOutsideCompanyHoursException extends ApplicationException {
    public LeaveTimeOutsideCompanyHoursException() {
        super(ApplicationErrorCode.LEAVE_TIME_OUTSIDE_COMPANY_HOURS_EXCEPTION);
    }
}
