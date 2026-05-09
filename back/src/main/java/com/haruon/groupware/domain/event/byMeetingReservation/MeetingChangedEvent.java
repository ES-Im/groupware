package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Builder
public record MeetingChangedEvent(
        String sourceKey,
        Long meetingRoomId,
        String title,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        Set<Long> participantEmpIds
) implements DomainEvent {
}
