package com.haruon.groupware.domain.event.byLeaveApprove;

import com.haruon.groupware.domain.event.DomainEvent;
import lombok.Builder;

@Builder
public record LeaveCancelledEvent(
        String sourceKey
) implements DomainEvent {
}
