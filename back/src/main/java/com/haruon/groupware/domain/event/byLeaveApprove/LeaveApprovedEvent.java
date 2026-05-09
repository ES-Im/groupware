package com.haruon.groupware.domain.event.byLeaveApprove;

import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record LeaveApprovedEvent(
        String sourceKey,
        Long drafterEmpId,
        String title,
        String content,
        LocalDateTime leaveStartAt,
        LocalDateTime leaveEndAt,
        LeaveType leaveType,
        ScheduleType scheduleType
) implements DomainEvent {
    public LeaveApprovedEvent {
        scheduleType = ScheduleType.LEAVE;
    }


}
