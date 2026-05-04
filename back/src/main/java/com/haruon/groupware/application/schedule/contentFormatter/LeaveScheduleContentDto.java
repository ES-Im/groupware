package com.haruon.groupware.application.schedule.contentFormatter;

public record LeaveScheduleContentDto(
        String leaveType
) implements ScheduleContentDto {
}
