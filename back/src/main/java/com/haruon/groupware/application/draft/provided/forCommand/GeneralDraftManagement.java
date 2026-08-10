package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;

import java.time.LocalDateTime;

/**
 * 일반 기안서 전용 command port
 */
public interface GeneralDraftManagement {

    Long createDraft(Long drafterId, CommonDraftCreateRequest request);

    Long createSubmitted(Long drafterId, CommonDraftCreateRequest request);

    void updateDraft(Long drafterId, Long draftId, CommonDraftUpdateRequest request);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);
}
