package com.haruon.groupware.application.exception.chat;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ChatNotFoundException extends ApplicationException {
    public ChatNotFoundException() {
        super(ErrorCode.CHATROOM_NOT_FOUND_EXCEPTION);
    }
}
