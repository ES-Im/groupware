package com.haruon.groupware.adapter.webapi.exception;

import com.haruon.groupware.adapter.webapi.exception.auth.InvalidLoginException;
import com.haruon.groupware.application.exception.ApplicationException;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.query.sqm.UnknownPathException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ErrorResponse> handle(ApplicationException e) {
        log.error("[application exception] name : {}, code : {}", e.getErrorCode().name(), e.getErrorCode().getCode());

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ErrorResponse.from(e.getErrorCode()));
    }

    @ExceptionHandler(AdapterException.class)
    public ResponseEntity<ErrorResponse> handle(AdapterException e) {
        log.error("[adapter exception]: name : {}, code : {}", e.getErrorCode().name(), e.getErrorCode().getCode());

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ErrorResponse.from(e.getErrorCode()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handle(ConstraintViolationException e) {
        log.error("ConstraintViolationException 발생: {}", e.getMessage(), e);

        return ResponseEntity
                .status(400)
                .body(ErrorResponse.from(e));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        InvalidLoginException e = new InvalidLoginException();

        log.warn("[BadCredentialsException] message={}, className={}",
                ex.getMessage(),
                ex.getClass().getName()
        );

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ErrorResponse.from(e.getErrorCode()));
    }

    //todo - 운영환경에서는 지우기
    @ExceptionHandler(UnknownPathException.class)
    public ResponseEntity<ErrorResponse> handle(UnknownPathException e) {
        log.error("쿼리 잘못함 =============================");

        return ResponseEntity.status(500)
                .body(ErrorResponse.from(e));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handle(Exception e) {
        log.error("Handler 처리가 필요. stackTrace: {}, message: {}", e.getStackTrace(), e.getMessage());

        return ResponseEntity
                .status(500)
                .body(ErrorResponse.from(e));
    }



}
