package com.haruon.groupware.application.meeting.service.query.dto;

public record MeetingRoomResponse(
        Long meetingRoomId,
        String name,
        Integer capacity,
        Boolean isAvailable
) {
}
