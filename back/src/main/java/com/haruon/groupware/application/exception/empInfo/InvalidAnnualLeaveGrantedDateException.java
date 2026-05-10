package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InvalidAnnualLeaveGrantedDateException extends ApplicationException {
    public InvalidAnnualLeaveGrantedDateException() {
        super(ErrorCode.INVALID_ANNUAL_LEAVE_GRANTED_DATE_EXCEPTION);
    }
}