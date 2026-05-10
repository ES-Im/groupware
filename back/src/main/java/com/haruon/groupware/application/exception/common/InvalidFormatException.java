package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InvalidFormatException extends ApplicationException {
    public InvalidFormatException(ErrorCode code, String message) {
        super(code, message);
    }
}
