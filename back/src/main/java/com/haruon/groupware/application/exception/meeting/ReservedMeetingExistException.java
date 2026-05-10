package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ReservedMeetingExistException extends ApplicationException {
    public ReservedMeetingExistException() {
        super(ErrorCode.RESERVED_MEETING_EXIST_EXCEPTION);
    }
}
