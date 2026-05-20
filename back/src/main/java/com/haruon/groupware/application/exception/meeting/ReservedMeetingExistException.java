package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ReservedMeetingExistException extends ApplicationException {
    public ReservedMeetingExistException() {
        super(ApplicationErrorCode.RESERVED_MEETING_EXIST_EXCEPTION);
    }
}
