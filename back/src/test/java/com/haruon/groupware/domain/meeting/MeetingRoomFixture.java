package com.haruon.groupware.domain.meeting;

public class MeetingRoomFixture {

    public static MeetingRoom getMeetingRoom() {
        return MeetingRoom.createMeetingRoom(
                "testRoom",
                "testRoomDescription",
                20
        );
    }
}
