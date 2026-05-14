package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidFormatException extends ApplicationException {
    public InvalidFormatException(ApplicationErrorCode code, String message) {
        super(code, message);
    }
}
