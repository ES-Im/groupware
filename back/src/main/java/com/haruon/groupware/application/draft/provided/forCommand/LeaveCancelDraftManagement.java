package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.CancelDraftCreateRequest;

import java.time.LocalDateTime;

/**
 * 휴가 취소 기안서의 작성과 상신을 제공
 */
public interface LeaveCancelDraftManagement {

    void createDraft(CancelDraftCreateRequest param);

    void createSubmitted(CancelDraftCreateRequest param);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);

}
