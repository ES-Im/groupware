package com.haruon.groupware.application.schedule.contentFormatter;

public record MeetingScheduleContentDto(
        String roomName,
        String title
) implements ScheduleContentDto {
}
