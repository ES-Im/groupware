package com.haruon.groupware.domain.event;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Transient;
import org.springframework.data.domain.AfterDomainEventPublication;
import org.springframework.data.domain.DomainEvents;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static java.util.Objects.requireNonNull;

public abstract class AbstractEventAggregateRoot extends AbstractEntity {

    @Transient private transient final List<DomainEvent> domainEvents = new ArrayList<>();

    protected <T extends DomainEvent> T registerEvent(T event) {
        requireNonNull(event, "등록할 이벤트가 없음");

        this.domainEvents.add(event);

        return event;
    }

    @DomainEvents
    public List<? extends DomainEvent> domainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }

    @AfterDomainEventPublication
    public void clearDomainEvents() {
        this.domainEvents.clear();
    }

}
