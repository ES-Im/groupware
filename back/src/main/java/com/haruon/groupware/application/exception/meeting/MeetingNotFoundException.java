package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class MeetingNotFoundException extends ApplicationException {
    public MeetingNotFoundException() {
        super(ApplicationErrorCode.MEETING_NOT_FOUND_EXCEPTION);
    }
}
