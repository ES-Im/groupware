package com.haruon.groupware.domain.event.byMeetingReservation;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

@Builder
public record MeetingParticipantReplaceEvent(
        String sourceKey,
        @Nullable Set<Long> removedParticipantIds,
        @Nullable Set<Long> addParticipantIds
) implements DomainEvent {
}


