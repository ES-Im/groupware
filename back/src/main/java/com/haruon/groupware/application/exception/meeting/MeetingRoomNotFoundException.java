package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class MeetingRoomNotFoundException extends ApplicationException {
    public MeetingRoomNotFoundException() {
        super(ApplicationErrorCode.MEETING_ROOM_NOT_FOUND_EXCEPTION);
    }
}
