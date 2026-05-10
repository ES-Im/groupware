package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class RequiredValueMissingException extends ApplicationException {

    public RequiredValueMissingException() {
        super(ErrorCode.REQUIRED_VALUE_MISSING_EXCEPTION);
    }

}
