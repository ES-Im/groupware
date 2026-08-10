package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public interface DraftManagementResolver {
    Long createCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request);

    Long createSubmittedCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request);

    void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> approvers);

    void revertToDraft(long draftId, long drafterId);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);

    void reject(long draftId, long rejecterId, String reason, LocalDateTime rejectedAt);

    void deleteDraft(long draftId, long drafterId);

    void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void markReadByCirculation(long draftId, long viewerId, LocalDateTime readAt);
}
