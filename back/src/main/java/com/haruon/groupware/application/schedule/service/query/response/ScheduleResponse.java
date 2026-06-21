package com.haruon.groupware.application.schedule.service.query.response;

import com.haruon.groupware.domain.schedule.ScheduleType;

import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleResponse(
        Long scheduleId,
        ScheduleType scheduleType,
        String title,
        LocalDate scheduleDate,
        LocalTime startAt,
        LocalTime endAt,
        Boolean isAllDay,
        Boolean isCanceled
) {
}
