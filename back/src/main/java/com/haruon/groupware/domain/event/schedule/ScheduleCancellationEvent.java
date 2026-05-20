package com.haruon.groupware.domain.event.schedule;

import com.haruon.groupware.domain.event.DomainEvent;

public record ScheduleCancellationEvent(
        String sourceKey
) implements DomainEvent {}