package com.haruon.groupware.application.exception.schedule;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ScheduleTimeOutsideCompanyHoursException extends ApplicationException {
    public ScheduleTimeOutsideCompanyHoursException() {
        super(ApplicationErrorCode.SCHEDULE_TIME_OUTSIDE_COMPANY_HOURS_EXCEPTION);
    }
}
