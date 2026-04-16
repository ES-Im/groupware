package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;

import java.util.Set;

@Builder
public record MeetingCanceledEvent(
        String sourceKey,
        Set<Long> participantIds
) implements DomainEvent {}