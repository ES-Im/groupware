package com.haruon.groupware.application.exception.chat;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ChatNotFoundException extends ApplicationException {
    public ChatNotFoundException() {
        super(ApplicationErrorCode.CHATROOM_NOT_FOUND_EXCEPTION);
    }
}
