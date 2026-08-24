package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 일반 기안서의 작성, 수정, 상신, 삭제을 제공 + 다른 타입의 기안서들의 공통 메서드 집합
 */
public interface GeneralDraftManagement {

    /** about general draft */
    Long createDraft(Long drafterId, CommonDraftCreateRequest param);

    Long createSubmitted(Long drafterId, CommonDraftCreateRequest param);

    void updateDraft(Long drafterEmpId, Long draftId, CommonDraftUpdateRequest param);

    /** about draft */
    void revertToDraft(long draftId, long drafterId);

    void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> params);

    void delete(long draftId, long drafterId);

    /** about approve */
    void approve(long draftId, long approverId, LocalDateTime approvedAt);

    void reject(long draftId, long rejecterId, String reason, LocalDateTime rejectedAt);

    /** about circulation */
    void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void markReadByCirculation(long draftId, long viewerId, LocalDateTime readAt);


}
