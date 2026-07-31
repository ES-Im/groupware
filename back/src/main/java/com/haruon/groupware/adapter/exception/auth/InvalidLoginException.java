package com.haruon.groupware.adapter.exception.auth;

import com.haruon.groupware.adapter.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.exception.AdapterException;

public class InvalidLoginException extends AdapterException {
    public InvalidLoginException() {
        super(AdapterErrorCode.INVALID_LOGIN_EXCEPTION);
    }
}
