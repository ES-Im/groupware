package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InactivatedMeetingRoomException extends ApplicationException {
    public InactivatedMeetingRoomException() {
        super(ApplicationErrorCode.INACTIVATED_MEETING_ROOM_EXCEPTION);
    }
}