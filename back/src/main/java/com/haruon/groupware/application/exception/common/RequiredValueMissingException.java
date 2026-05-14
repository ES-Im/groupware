package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class RequiredValueMissingException extends ApplicationException {

    public RequiredValueMissingException() {
        super(ApplicationErrorCode.REQUIRED_VALUE_MISSING_EXCEPTION);
    }

}
