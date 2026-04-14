package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;
import java.util.List;

@Builder
public record UnassignEmpToMeetingScheduleEvent(
        String sourceKey,
        Long meetingRoomId,
        List<Long> participantsId,
        ScheduleType scheduleType
) implements DomainEvent {
    public UnassignEmpToMeetingScheduleEvent {
        scheduleType = ScheduleType.MEETING;
    }
}


