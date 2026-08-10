package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.createDraft.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.LeaveDraftUpdateRequest;

import java.time.LocalDateTime;

/**
 * 휴가 기안서 전용 command port
 */
public interface LeaveDraftManagement {

    Long createDraft(Long drafterId, LeaveDraftCreateRequest request);

    Long createSubmitted(Long drafterId, LeaveDraftCreateRequest request);

    void updateDraft(Long drafterEmpId, Long draftId, LeaveDraftUpdateRequest request);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);
}
