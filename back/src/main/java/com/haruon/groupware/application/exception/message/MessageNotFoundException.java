package com.haruon.groupware.application.exception.message;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class MessageNotFoundException extends ApplicationException {
    public MessageNotFoundException() {
        super(ApplicationErrorCode.MESSAGE_NOT_FOUND_EXCEPTION);
    }
}
