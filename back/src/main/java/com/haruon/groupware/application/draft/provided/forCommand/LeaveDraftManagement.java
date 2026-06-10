package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.LeaveDraftUpdateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 휴가 기안서의 작성, 수정, 상신을 제공
 */
public interface LeaveDraftManagement {

    /** about leave draft */
    Long createDraft(Long drafterId, LeaveDraftCreateRequest param);

    Long createSubmitted(Long drafterId, LeaveDraftCreateRequest param);

    void updateDraft(Long drafterEmpId, Long draftId, LeaveDraftUpdateRequest param);


    /** about draft */
    void revertToDraft(long draftId, long drafterId);

    void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> params);

    /** about approve */
    void approve(long draftId, long approverId, LocalDateTime approvedAt);

    void reject(long draftId, long rejecterId, String reason, LocalDateTime rejectedAt);

    /** about circulation */
    void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

}
