package com.haruon.groupware.application.exception;

import lombok.Getter;

@Getter
public class ApplicationException extends RuntimeException implements ErrorCodeCarrier {

    private final ErrorCode errorCode;

    public ApplicationException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ApplicationException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
