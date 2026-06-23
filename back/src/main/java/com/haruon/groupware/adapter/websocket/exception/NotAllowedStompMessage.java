package com.haruon.groupware.adapter.websocket.exception;

import lombok.Getter;

@Getter
public class NotAllowedStompMessage extends IllegalArgumentException {

    private final StompErrorCode errorCode = StompErrorCode.NOT_ALLOWED_MESSAGE;

    public NotAllowedStompMessage() {
        super(StompErrorCode.NOT_ALLOWED_MESSAGE.getMessage());
    }

    public NotAllowedStompMessage(String detailErrorMsg) {
        super(detailErrorMsg);
    }

    public NotAllowedStompMessage(String detailErrorMsg, Throwable cause) {
        super(detailErrorMsg, cause);
    }
}
