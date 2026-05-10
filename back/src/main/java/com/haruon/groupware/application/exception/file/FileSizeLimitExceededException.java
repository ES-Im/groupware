package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class FileSizeLimitExceededException extends ApplicationException {
    public FileSizeLimitExceededException() {
        super(ErrorCode.FILE_SIZE_LIMIT_EXCEEDED_EXCEPTION);
    }
}
