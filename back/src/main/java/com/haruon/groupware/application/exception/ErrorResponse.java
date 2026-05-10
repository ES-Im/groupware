package com.haruon.groupware.application.exception;

/**
 * JSON 변환용 응답 DTO
 */
public record ErrorResponse(
        String code, String name, int httpStatus, String message
) {
    public static ErrorResponse from(ErrorCode ec) {
        return new ErrorResponse(
                ec.name(), ec.getCode(), ec.getStatus().value(), ec.getMessage()
        );
    }
}