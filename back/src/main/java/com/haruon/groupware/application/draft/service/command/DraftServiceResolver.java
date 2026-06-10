package com.haruon.groupware.application.draft.service.command;

import com.haruon.groupware.application.draft.provided.forCommand.*;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CancelDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.domain.draft.*;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class DraftServiceResolver implements DraftManagementResolver {

    private final DraftRepository draftRepository;
    private final LeaveCancelDraftManagement leaveCancelDraftManagement;
    private final BusinessTripCancelDraftManagement businessTripCancelDraftManagement;

    private final LeaveDraftManagement leaveDraftManagement;
    private final BusinessTripDraftManagement businessTripDraftManagement;
    private final GeneralDraftManagement generalDraftManagement;
    private final SalesDraftManagement salesDraftManagement;

    @Override
    public Long createCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request) {
        return createCancelDraft(drafterId, sourceDraftId, request, false);
    }

    @Override
    public Long createSubmittedCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request) {
        return createCancelDraft(drafterId, sourceDraftId, request, true);
    }

    private Long createCancelDraft(Long drafterId, Long sourceDraftId, CommonDraftCreateRequest request, boolean submitted) {
        Draft sourceDraft = getSourceDraft(sourceDraftId);

        CancelDraftCreateRequest cancelRequest = CancelDraftCreateRequest.builder()
                .param(request)
                .sourceKey(sourceDraft.getSourceKey())
                .build();

        switch(sourceDraft) {
            case LeaveDraft leaveDraft -> {
                return submitted
                        ? leaveCancelDraftManagement.createSubmitted(drafterId, cancelRequest)
                        : leaveCancelDraftManagement.createDraft(drafterId, cancelRequest);
            }
            case BusinessTripDraft businessTripDraft -> {
                return submitted
                        ? businessTripCancelDraftManagement.createSubmitted(drafterId, cancelRequest)
                        : businessTripCancelDraftManagement.createDraft(drafterId, cancelRequest);
            }
            default -> throw new DraftTypeMismatchException();
        }
    }

    @Override
    public void submit(Long draftId, Long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> approvers) {
        generalDraftManagement.submit(draftId, drafterId, submittedAt, approvers);
    }

    @Override
    public void revertToDraft(Long draftId, Long drafterId) {
        generalDraftManagement.revertToDraft(draftId, drafterId);
    }

    @Override
    public void approve(Long draftId, Long approverId, LocalDateTime approvedAt) {
        Draft draft = getSourceDraft(draftId);

        switch(draft) {
            case LeaveDraft leaveDraft -> leaveDraftManagement.approve(draftId, approverId, approvedAt);
            case BusinessTripDraft businessTripDraft -> businessTripDraftManagement.approve(draftId, approverId, approvedAt);
            case SalesDraft salesDraft -> salesDraftManagement.approve(draftId, approverId, approvedAt);
            case GeneralDraft generalDraft -> generalDraftManagement.approve(draftId, approverId, approvedAt);
            case LeaveCancelDraft leaveCancelDraft -> leaveCancelDraftManagement.approve(draftId, approverId, approvedAt);
            case BusinessTripCancelDraft businessTripCancelDraft ->
                    businessTripCancelDraftManagement.approve(draftId, approverId, approvedAt);
            default -> throw new DraftTypeMismatchException();
        }
    }

    @Override
    public void reject(Long draftId, Long rejecterId, String reason, LocalDateTime rejectedAt) {
        generalDraftManagement.reject(draftId, rejecterId, reason, rejectedAt);
    }

    @Override
    public void addCirculatedEmp(Long draftId, Long drafterId, Long circulatedEmpId) {
        generalDraftManagement.addCirculatedEmp(draftId, drafterId, circulatedEmpId);
    }

    @Override
    public void removeCirculatedEmp(Long draftId, Long drafterId, Long circulatedEmpId) {
        generalDraftManagement.removeCirculatedEmp(draftId, drafterId, circulatedEmpId);
    }

    @Override
    public void markReadByCirculation(Long draftId, Long viewerId, LocalDateTime readAt) {
        generalDraftManagement.markReadByCirculation(draftId, viewerId, readAt);
    }

    private Draft getSourceDraft(Long sourceDraftId) {
        return draftRepository.findById(sourceDraftId)
                .orElseThrow(DraftNotFoundException::new);
    }
}
