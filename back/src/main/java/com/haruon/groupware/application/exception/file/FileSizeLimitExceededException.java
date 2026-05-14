package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class FileSizeLimitExceededException extends ApplicationException {
    public FileSizeLimitExceededException() {
        super(ApplicationErrorCode.FILE_SIZE_LIMIT_EXCEEDED_EXCEPTION);
    }
}
