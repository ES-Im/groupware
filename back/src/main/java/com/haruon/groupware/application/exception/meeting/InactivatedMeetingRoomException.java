package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InactivatedMeetingRoomException extends ApplicationException {
    public InactivatedMeetingRoomException() {
        super(ErrorCode.INACTIVATED_MEETING_ROOM_EXCEPTION);
    }
}