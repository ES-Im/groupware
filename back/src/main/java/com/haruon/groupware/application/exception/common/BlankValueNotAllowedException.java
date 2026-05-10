package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class BlankValueNotAllowedException extends ApplicationException {
    public BlankValueNotAllowedException() {
        super(ErrorCode.BLANK_VALUE_NOT_ALLOWED_EXCEPTION);
    }
}
