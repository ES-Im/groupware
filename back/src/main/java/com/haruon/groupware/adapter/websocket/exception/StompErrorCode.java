package com.haruon.groupware.adapter.websocket.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StompErrorCode {
    NOT_ALLOWED_MESSAGE("WEB_SOCKET_001", "검증되지 않은 클라이언트 STOMP 메시지입니다.");

    private final String code;
    private final String message;
}
