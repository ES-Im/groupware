package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class UnsupportedFileExtensionException extends ApplicationException {
    public UnsupportedFileExtensionException() {
        super(ErrorCode.UNSUPPORTED_FILE_EXTENSION_EXCEPTION);
    }
}

