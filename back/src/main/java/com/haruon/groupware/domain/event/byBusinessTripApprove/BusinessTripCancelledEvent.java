package com.haruon.groupware.domain.event.byBusinessTripApprove;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;

@Builder
public record BusinessTripCancelledEvent(
        String sourceKey
) implements DomainEvent {
}
