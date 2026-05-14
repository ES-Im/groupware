package com.haruon.groupware.adapter.webapi.exception;

import lombok.Getter;

@Getter
public class AdapterException extends RuntimeException {

    private final AdapterErrorCode errorCode;

    public AdapterException(AdapterErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AdapterException(AdapterErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }

}
