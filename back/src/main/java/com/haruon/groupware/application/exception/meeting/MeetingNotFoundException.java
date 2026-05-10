package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class MeetingNotFoundException extends ApplicationException {
    public MeetingNotFoundException() {
        super(ErrorCode.MEETING_NOT_FOUND_EXCEPTION);
    }
}
