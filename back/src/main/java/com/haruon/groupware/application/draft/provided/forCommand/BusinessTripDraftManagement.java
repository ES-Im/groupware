package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.BusinessTripDraftUpdateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * 출장 기안서의 작성, 수정, 상신 및 참여자/본문 관리를 제공
 */
public interface BusinessTripDraftManagement {

    /** about business trip */
    void createDraft(BusinessTripDraftCreateRequest param);

    void createSubmitted(BusinessTripDraftCreateRequest param);

    void updateDraft(BusinessTripDraftUpdateRequest param);

    void updateParticipants(long draftId, long drafter, Set<Long> participantId);

    /** about draft */
    void revertToDraft(long draftId, long drafterId);

    void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> params);

    /** about approve */
    void approve(long draftId, long approverId, LocalDateTime approvedAt);
    //todo -> 모든 승인 끝나면 markReadByCirculation 호출

    void reject(long draftId, long rejecterId, String reason, LocalDateTime rejectedAt);

    /** about circulation */
    void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    //todo isReadableByCirculation -> 조회용, 공람자 리스트 출력시 사용할 것
}
