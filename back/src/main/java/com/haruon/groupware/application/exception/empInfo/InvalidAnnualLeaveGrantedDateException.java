package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidAnnualLeaveGrantedDateException extends ApplicationException {
    public InvalidAnnualLeaveGrantedDateException() {
        super(ApplicationErrorCode.INVALID_ANNUAL_LEAVE_GRANTED_DATE_EXCEPTION);
    }
}