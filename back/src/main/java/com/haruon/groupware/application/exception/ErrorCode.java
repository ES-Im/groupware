package com.haruon.groupware.application.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    FranchiseNotFoundException(HttpStatus.NOT_FOUND, "FRANCHISE_001", "해당 가맹점 정보를 찾을 수 없음");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = String.valueOf(code);
        this.message = message;
    }
}
