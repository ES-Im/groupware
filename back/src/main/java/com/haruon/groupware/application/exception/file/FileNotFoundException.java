package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class FileNotFoundException extends ApplicationException {
    public FileNotFoundException() {
        super(ErrorCode.FILE_NOT_FOUND_EXCEPTION);
    }
}
