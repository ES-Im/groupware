package com.haruon.groupware.adapter.exception.file;

import com.haruon.groupware.adapter.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.exception.AdapterException;

public class FileStoreFailedException extends AdapterException {
    public FileStoreFailedException() {
        super(AdapterErrorCode.FILE_STORE_FAILED_EXCEPTION);
    }
}