package com.haruon.groupware.application.exception.meeting;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class MeetingParticipantRequiredException extends ApplicationException {
    public MeetingParticipantRequiredException() {
        super(ApplicationErrorCode.MEETING_PARTICIPANT_REQUIRED_EXCEPTION);
    }
}
