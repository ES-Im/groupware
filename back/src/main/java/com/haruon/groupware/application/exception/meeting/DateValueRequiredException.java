package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DateValueRequiredException extends ApplicationException {
    public DateValueRequiredException() {
        super(ApplicationErrorCode.DATE_VALUE_REQUIRED_EXCEPTION);
    }
}
