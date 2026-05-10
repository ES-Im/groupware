package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InvalidFileNameException extends ApplicationException {
    public InvalidFileNameException() {
        super(ErrorCode.INVALID_FILE_NAME_EXCEPTION);
    }
}
