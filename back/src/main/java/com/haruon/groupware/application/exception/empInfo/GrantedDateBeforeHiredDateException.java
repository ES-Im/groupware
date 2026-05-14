package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class GrantedDateBeforeHiredDateException extends ApplicationException {
    public GrantedDateBeforeHiredDateException() {
        super(ApplicationErrorCode.GRANTED_DATE_BEFORE_HIRED_DATE_EXCEPTION);
    }
}