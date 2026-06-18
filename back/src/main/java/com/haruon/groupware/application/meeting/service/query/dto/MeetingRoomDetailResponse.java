package com.haruon.groupware.application.meeting.service.query.dto;

public record MeetingRoomDetailResponse(
        Long meetingRoomId,
        String name,
        String description,
        Integer capacity,
        Boolean isAvailable
) {
}
