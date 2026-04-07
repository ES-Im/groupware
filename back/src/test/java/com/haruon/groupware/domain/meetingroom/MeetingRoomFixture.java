package com.haruon.groupware.domain.meetingroom;

public class MeetingRoomFixture {

    public static MeetingRoom getMeetingRoom() {
        return MeetingRoom.createMeetingRoom(
                "testRoom",
                "testRoomDescription",
                20
        );
    }
}
