package com.haruon.groupware.application.meeting.provided;

import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomFileCreateRequest;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomUpdateRequest;

public interface MeetingRoomManagement {
    void createMeetingRoom(MeetingRoomCreateRequest request);

    void changeRoomInfo(MeetingRoomUpdateRequest request);

    void activate(Long roomId, Long empId);

    void deactivate(Long roomId, Long empId);

    void addRoomFile(MeetingRoomFileCreateRequest request);

    void removeRoomFile(Long roomId, Long empId, Long fileId);
}
