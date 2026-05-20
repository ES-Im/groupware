package com.haruon.groupware.adapter.webapi.exception;

import com.haruon.groupware.application.exception.ApplicationErrorCode;

/**
 * Error를 JSON 변환해주는 응답 DTO
 */
public record ErrorResponse(
        String code, String name, int httpStatus, String message
) {
    public static ErrorResponse from(ApplicationErrorCode ec) {
        return new ErrorResponse(
                ec.name(), ec.getCode(), ec.getStatus().value(), ec.getMessage()
        );
    }

    public static ErrorResponse from(AdapterErrorCode ec) {
        return new ErrorResponse(
                ec.name(), ec.getCode(), ec.getStatus().value(), ec.getMessage()
        );
    }

    public static ErrorResponse from(Exception e) {
        return new ErrorResponse(
                e.getClass().getSimpleName(),
                e.getClass().getName(),
                500,
                e.getMessage()
        );
    }
}