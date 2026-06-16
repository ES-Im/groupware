package com.haruon.groupware.application.meeting.provided.forCommand;

import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;

public interface MeetingRoomManagement {
    long createMeetingRoom(MeetingRoomCreateRequest request);

    void changeRoomInfo(MeetingRoomUpdateRequest request);

    void activate(Long roomId, Long empId);

    void deactivate(Long roomId, Long empId);
}
