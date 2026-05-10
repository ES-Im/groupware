package com.haruon.groupware.application.exception.message;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class MessageNotFoundException extends ApplicationException {
    public MessageNotFoundException() {
        super(ErrorCode.MESSAGE_NOT_FOUND_EXCEPTION);
    }
}
