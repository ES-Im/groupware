package com.haruon.groupware.adapter.webapi.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum AdapterErrorCode {
    // 인증
    INVALIDLOGIN(HttpStatus.UNAUTHORIZED, "AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다")
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
