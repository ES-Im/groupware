package com.haruon.groupware.domain.event.byBusinessTripApprove;

import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record BusinessTripApprovedEvent(
        String sourceKey,
        Long drafterEmpId,
        String title,
        String content,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String destination,
        String purpose,
        List<Long> participantsId,
        ScheduleType scheduleType
) implements DomainEvent {
    public BusinessTripApprovedEvent {
        scheduleType = ScheduleType.BUSINESS_TRIP;
    }
}
