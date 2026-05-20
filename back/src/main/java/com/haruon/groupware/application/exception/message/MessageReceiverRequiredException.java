package com.haruon.groupware.application.exception.message;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class MessageReceiverRequiredException extends ApplicationException {
    public MessageReceiverRequiredException() {
        super(ApplicationErrorCode.MESSAGE_RECEIVER_REQUIRED_EXCEPTION);
    }
}
