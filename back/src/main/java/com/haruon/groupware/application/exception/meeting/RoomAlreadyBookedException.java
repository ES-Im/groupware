package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class RoomAlreadyBookedException extends ApplicationException {
    public RoomAlreadyBookedException() {
        super(ApplicationErrorCode.ROOM_ALREADY_BOOKED_EXCEPTION);
    }
}
