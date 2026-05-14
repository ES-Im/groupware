package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class FileNotFoundException extends ApplicationException {
    public FileNotFoundException() {
        super(ApplicationErrorCode.FILE_NOT_FOUND_EXCEPTION);
    }
}
