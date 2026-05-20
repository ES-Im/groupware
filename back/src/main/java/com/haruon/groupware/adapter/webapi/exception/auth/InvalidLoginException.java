package com.haruon.groupware.adapter.webapi.exception.auth;

import com.haruon.groupware.adapter.webapi.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.webapi.exception.AdapterException;

public class InvalidLoginException extends AdapterException {
    public InvalidLoginException() {
        super(AdapterErrorCode.INVALIDLOGIN);
    }
}
