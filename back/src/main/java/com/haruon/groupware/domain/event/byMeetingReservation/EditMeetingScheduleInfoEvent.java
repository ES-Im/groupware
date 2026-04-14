package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Builder
public record EditMeetingScheduleInfoEvent(
        @Nullable Long meetingRoomId,
        @Nullable String title,
        @Nullable LocalDate meetingDate,
        @Nullable LocalTime startAt,
        @Nullable LocalTime endAt,
        @Nullable List<Long> participantsId
) implements DomainEvent {
    public EditMeetingScheduleInfoEvent {

    }
}


