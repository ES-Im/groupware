package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnsupportedMimeTypeException extends ApplicationException {
    public UnsupportedMimeTypeException() {
        super(ApplicationErrorCode.UNSUPPORTED_MIME_TYPE_EXCEPTION);
    }
}
