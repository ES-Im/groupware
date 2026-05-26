package com.haruon.groupware.adapter.webapi.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum AdapterErrorCode {
    // 인증
    INVALIDLOGIN(HttpStatus.UNAUTHORIZED, "AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다"),

    // 파일
    FILE_CONVERT_FAILED_EXCEPTION(HttpStatus.BAD_REQUEST, "FILE_001", "파일 변환에 실패했습니다."),
    FILE_STORE_FAILED_EXCEPTION(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_002", "파일 저장에 실패했습니다")
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
