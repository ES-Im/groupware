package com.haruon.groupware.application.exception.message;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class MessageReceiverRequiredException extends ApplicationException {
    public MessageReceiverRequiredException() {
        super(ErrorCode.MESSAGE_RECEIVER_REQUIRED_EXCEPTION);
    }
}
