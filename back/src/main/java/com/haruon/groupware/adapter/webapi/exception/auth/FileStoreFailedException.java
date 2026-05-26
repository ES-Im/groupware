package com.haruon.groupware.adapter.webapi.exception.auth;

import com.haruon.groupware.adapter.webapi.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.webapi.exception.AdapterException;

public class FileStoreFailedException extends AdapterException {
    public FileStoreFailedException() {
        super(AdapterErrorCode.FILE_STORE_FAILED_EXCEPTION);
    }
}