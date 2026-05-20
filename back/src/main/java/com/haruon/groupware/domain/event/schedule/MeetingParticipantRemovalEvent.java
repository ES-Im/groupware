package com.haruon.groupware.domain.event.schedule;

import com.haruon.groupware.domain.event.DomainEvent;
import org.jspecify.annotations.Nullable;

import java.util.Set;

public record MeetingParticipantRemovalEvent(
        String sourceKey,
        @Nullable Set<Long> targetParticipantIds
) implements DomainEvent {
}


