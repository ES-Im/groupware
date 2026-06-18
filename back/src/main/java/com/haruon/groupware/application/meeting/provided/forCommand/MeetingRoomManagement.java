package com.haruon.groupware.application.meeting.provided.forCommand;

import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.command.dto.MeetingRoomUpdateRequest;

public interface MeetingRoomManagement {
    long createMeetingRoom(Long editorId, MeetingRoomCreateRequest request);

    void changeRoomInfo(Long roomId, Long editorId, MeetingRoomUpdateRequest request);

    void activate(Long roomId, Long empId);

    void deactivate(Long roomId, Long empId);
}
