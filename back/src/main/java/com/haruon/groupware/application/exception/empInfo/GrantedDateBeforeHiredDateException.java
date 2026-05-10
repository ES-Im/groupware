package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class GrantedDateBeforeHiredDateException extends ApplicationException {
    public GrantedDateBeforeHiredDateException() {
        super(ErrorCode.GRANTED_DATE_BEFORE_HIRED_DATE_EXCEPTION);
    }
}