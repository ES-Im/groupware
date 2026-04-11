package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.BusinessTripDraftUpdateRequest;

/**
 * 출장 기안서의 작성, 수정, 상신 및 참여자/본문 관리를 제공
 */
public interface BusinessTripDraftManagement {
    void createDraft(BusinessTripDraftCreateRequest param);

    void createSubmitted(BusinessTripDraftCreateRequest param);

    void updateDraft(BusinessTripDraftUpdateRequest param);

    void addBusinessTripParticipant(long draftId, long drafter, long participantId);

    void removeBusinessTripParticipant(long draftId, long drafter, long participantId);

}
