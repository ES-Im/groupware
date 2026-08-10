package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.createDraft.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.BusinessTripDraftUpdateRequest;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 출장 기안서 전용 command port
 */
public interface BusinessTripDraftManagement {

    Long createDraft(Long drafterId, BusinessTripDraftCreateRequest request);

    Long createSubmitted(Long drafterId, BusinessTripDraftCreateRequest request);

    void updateDraft(Long drafterEmpId, Long draftId, BusinessTripDraftUpdateRequest request);

    void updateParticipants(long draftId, long drafterId, Set<Long> participantIds);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);
}
