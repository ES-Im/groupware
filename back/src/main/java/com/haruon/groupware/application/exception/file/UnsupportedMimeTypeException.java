package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class UnsupportedMimeTypeException extends ApplicationException {
    public UnsupportedMimeTypeException() {
        super(ErrorCode.UNSUPPORTED_MIME_TYPE_EXCEPTION);
    }
}
