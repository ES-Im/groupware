package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class MeetingRoomNotFoundException extends ApplicationException {
    public MeetingRoomNotFoundException() {
        super(ErrorCode.MEETING_ROOM_NOT_FOUND_EXCEPTION);
    }
}
