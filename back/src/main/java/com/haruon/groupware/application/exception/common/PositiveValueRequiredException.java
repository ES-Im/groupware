package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class PositiveValueRequiredException extends ApplicationException {
    public PositiveValueRequiredException() {
        super(ApplicationErrorCode.POSITIVE_VALUE_REQUIRED_EXCEPTION);
    }
}
