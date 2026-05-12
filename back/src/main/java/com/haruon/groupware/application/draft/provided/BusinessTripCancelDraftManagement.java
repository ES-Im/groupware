package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.service.dto.CancelDraftCreateRequest;

import java.time.LocalDateTime;

/**
 * 출장 취소 기안서의 작성과 상신을 제공
 */
public interface BusinessTripCancelDraftManagement {

    void createDraft(CancelDraftCreateRequest param);

    void createSubmitted(CancelDraftCreateRequest param);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);

}
