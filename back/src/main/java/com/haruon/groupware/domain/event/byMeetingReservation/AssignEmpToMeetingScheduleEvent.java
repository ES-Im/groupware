package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Builder
public record AssignEmpToMeetingScheduleEvent(
        String sourceKey,
        Long meetingRoomId,
        Long reserverId,
        String title,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        List<Long> participantsId,
        ScheduleType scheduleType
) implements DomainEvent {
    public AssignEmpToMeetingScheduleEvent {
        scheduleType = ScheduleType.MEETING;
    }
}


