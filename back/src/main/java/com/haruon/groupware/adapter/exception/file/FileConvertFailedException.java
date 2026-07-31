package com.haruon.groupware.adapter.exception.file;

import com.haruon.groupware.adapter.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.exception.AdapterException;

public class FileConvertFailedException extends AdapterException {
    public FileConvertFailedException() {
        super(AdapterErrorCode.FILE_CONVERT_FAILED_EXCEPTION);
    }
}