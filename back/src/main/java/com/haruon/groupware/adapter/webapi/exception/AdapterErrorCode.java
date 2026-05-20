package com.haruon.groupware.adapter.webapi.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum AdapterErrorCode {
    ;


    private final HttpStatus status;
    private final String code;
    private final String message;

    AdapterErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
