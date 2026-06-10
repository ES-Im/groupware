package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public interface DraftManagementResolver {
    Long createCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request);

    Long createSubmittedCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request);

    void submit(Long draftId, Long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> approvers);

    void revertToDraft(Long draftId, Long drafterId);

    void approve(Long draftId, Long approverId, LocalDateTime approvedAt);

    void reject(Long draftId, Long rejecterId, String reason, LocalDateTime rejectedAt);

    void addCirculatedEmp(Long draftId, Long drafterId, Long circulatedEmpId);

    void removeCirculatedEmp(Long draftId, Long drafterId, Long circulatedEmpId);

    void markReadByCirculation(Long draftId, Long viewerId, LocalDateTime readAt);
}
