package com.haruon.groupware.adapter.webapi.exception.auth;

import com.haruon.groupware.adapter.webapi.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.webapi.exception.AdapterException;

public class FileConvertFailedException extends AdapterException {
    public FileConvertFailedException() {
        super(AdapterErrorCode.FILE_CONVERT_FAILED_EXCEPTION);
    }
}