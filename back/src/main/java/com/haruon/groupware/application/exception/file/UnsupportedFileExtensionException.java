package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnsupportedFileExtensionException extends ApplicationException {
    public UnsupportedFileExtensionException() {
        super(ApplicationErrorCode.UNSUPPORTED_FILE_EXTENSION_EXCEPTION);
    }
}

