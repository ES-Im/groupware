package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class PositiveValueRequiredException extends ApplicationException {
    public PositiveValueRequiredException() {
        super(ErrorCode.POSITIVE_VALUE_REQUIRED_EXCEPTION);
    }
}
