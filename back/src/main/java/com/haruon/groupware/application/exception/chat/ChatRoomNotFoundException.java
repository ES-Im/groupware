package com.haruon.groupware.application.exception.chat;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ChatRoomNotFoundException extends ApplicationException {
    public ChatRoomNotFoundException() {
        super(ErrorCode.CATEGORY_NOT_FOUND_EXCEPTION);
    }
}
