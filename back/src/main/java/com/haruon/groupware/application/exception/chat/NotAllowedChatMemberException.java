package com.haruon.groupware.application.exception.chat;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class NotAllowedChatMemberException extends ApplicationException {
    public NotAllowedChatMemberException() {
        super(ApplicationErrorCode.NOT_ALLOWED_CHAT_MEMBER_EXCEPTION);
    }
}
