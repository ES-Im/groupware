package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InvalidFileNameException extends ApplicationException {
    public InvalidFileNameException() {
        super(ApplicationErrorCode.INVALID_FILE_NAME_EXCEPTION);
    }
}
