package com.haruon.groupware.application.schedule.event;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.schedule.provided.forCommand.ScheduleEventProcessor;
import com.haruon.groupware.domain.event.schedule.MeetingParticipantAdditionEvent;
import com.haruon.groupware.domain.event.schedule.MeetingParticipantRemovalEvent;
import com.haruon.groupware.domain.event.schedule.ScheduleCancellationEvent;
import com.haruon.groupware.domain.event.schedule.ScheduleCreationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import static org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduleEventHandler {

    private final ScheduleEventProcessor scheduleEventProcessor;


    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void handleApplyScheduleCreation(ScheduleCreationEvent event) {
        scheduleEventProcessor.applyScheduleCreation(event.sourceKey());
    }

    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void handleApplyScheduleCancellation(ScheduleCancellationEvent event) {
        scheduleEventProcessor.applyScheduleCancellation(event.sourceKey());
    }

    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void handleApplyParticipantAddition(MeetingParticipantAdditionEvent event) {
        if(event.targetParticipantIds() == null) throw new RequiredValueMissingException();

        scheduleEventProcessor.applyParticipantAddition(event.sourceKey(), event.targetParticipantIds());
    }

    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void handleApplyParticipantRemoval(MeetingParticipantRemovalEvent event) {
        if(event.targetParticipantIds() == null) throw new RequiredValueMissingException();

        scheduleEventProcessor.applyParticipantRemoval(event.sourceKey(), event.targetParticipantIds());
    }


}
