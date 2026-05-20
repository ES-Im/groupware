package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class BlankValueNotAllowedException extends ApplicationException {
    public BlankValueNotAllowedException() {
        super(ApplicationErrorCode.BLANK_VALUE_NOT_ALLOWED_EXCEPTION);
    }
}
