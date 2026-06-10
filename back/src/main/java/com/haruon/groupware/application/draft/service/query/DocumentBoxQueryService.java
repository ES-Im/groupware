package com.haruon.groupware.application.draft.service.query;

import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.required.DocumentBoxQueryRepository;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.DraftDetailResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.MyDocumentBoxSummaryResponse;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.BelongingInfo;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.domain.draft.*;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class DocumentBoxQueryService implements DocumentBoxRetriever {

    private final DocumentBoxQueryRepository documentBoxQueryRepository;
    private final DraftRepository draftRepository;

    @Override
    public Page<DocumentBoxResponse> retrieveMySubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findSubmittedDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrieveMyUnsubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findUnSubmittedDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrievePendingMyApprovalDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findPendingApprovalDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrieveMyAccessibleDocuments(
            Long empId,
            List<BelongingInfo> belongingInfos,
            @Nullable String keyword,
            Pageable pageable
    ) {
        List<Long> deptIds = belongingInfos.stream()
                .map(BelongingInfo::deptId)
                .toList();

        return documentBoxQueryRepository.findAccessibleDraftsByEmpId(
                empId, deptIds, keyword, pageable
        );
    }

    @Override
    public Long retrievePendingMyApprovalDraftsCount(Long empId) {
        return documentBoxQueryRepository.countPendingApprovalDraftsByEmpId(empId);
    }

    @Override
    public DraftDetailResponse retrieveDraftDetail(Long empId, List<BelongingInfo> belongingInfos, Long draftId) {
        Draft draft = draftRepository.findById(draftId)
                .orElseThrow(DraftNotFoundException::new);
        List<Long> deptIds = toDeptIds(belongingInfos);

        if (!canReadDraft(empId, deptIds, draft))  throw new PermissionDeniedException();

        Draft cancellationDraft = findCancellationDraft(draft);

        return new DraftDetailResponse(
                draft.getId(),
                draft.getClass().getSimpleName(),
                toEmpSummary(draft.getEmp()),
                draft.getTitle(),
                draft.getContent(),
                draft.getSubmittedAt(),
                draft.getApproval().getStatus().getDescription(),
                toFileSummaries(draft),
                toApproverSummaries(draft),
                toCirculationSummaries(draft),
                findSourceDraftId(draft),
                cancellationDraft == null ? null : cancellationDraft.getId(),
                cancellationDraft == null ? null : cancellationDraft.getSubmittedAt(),
                toLeaveDetail(draft),
                toBusinessTripDetail(draft),
                toSalesDetail(draft)
        );
    }

    @Override
    public MyDocumentBoxSummaryResponse retrieveMyDocumentBoxSummary(Long empId, List<BelongingInfo> belongingInfos) {
        List<Long> deptIds = toDeptIds(belongingInfos);

        return new MyDocumentBoxSummaryResponse(
                documentBoxQueryRepository.countPendingApprovalDraftsByEmpId(empId),
                documentBoxQueryRepository.countUnSubmittedDraftsByEmpId(empId),
                documentBoxQueryRepository.countSubmittedDraftsByEmpId(empId),
                documentBoxQueryRepository.countAccessibleDraftsByEmpId(empId, deptIds)
        );
    }

    private List<Long> toDeptIds(List<BelongingInfo> belongingInfos) {
        return belongingInfos.stream()
                .map(BelongingInfo::deptId)
                .toList();
    }

    private boolean canReadDraft(Long empId, List<Long> deptIds, Draft draft) {
        boolean isDrafter = draft.getEmp().getId().equals(empId);

        boolean isApprover = draft.getApproval().getApprovers().stream()
                .anyMatch(approver -> approver.getApprover().getId().equals(empId));

        boolean isCirculated = draft.getCirculations().stream()
                .anyMatch(circulation -> circulation.getViewer().getId().equals(empId));

        boolean isApprovedDeptDocument = draft.getApproval().getStatus().equals(ApprovalStatus.APPROVED)
                && draft.getEmp().getEmpBelongings().stream()
                                                    .filter(belonging -> belonging.getEndAt() == null)
                                                    .map(EmpBelongings::getDept)
                                                    .anyMatch(dept -> deptIds.contains(dept.getId()));

        return isDrafter || isApprover || isCirculated || isApprovedDeptDocument;
    }

    private DraftDetailResponse.EmpSummary toEmpSummary(Emp emp) {
        return new DraftDetailResponse.EmpSummary(emp.getId(), emp.getEmpName());
    }

    private List<DraftDetailResponse.DraftFileSummary> toFileSummaries(Draft draft) {
        return draft.getDraftFiles().stream()
                .map(file -> new DraftDetailResponse.DraftFileSummary(
                        file.getId(),
                        file.getOriginalName(),
                        file.getMimeType(),
                        file.getExtension(),
                        file.getFileSize()
                ))
                .toList();
    }

    private List<DraftDetailResponse.ApproverSummary> toApproverSummaries(Draft draft) {
        return draft.getApproval().getApprovers().stream()
                .map(approver -> new DraftDetailResponse.ApproverSummary(
                        approver.getApprover().getId(),
                        approver.getApprover().getEmpName(),
                        approver.getRole().name(),
                        approver.getOrder(),
                        approver.getApprovedAt(),
                        approver.getRejectedAt(),
                        approver.getRejectReason()
                ))
                .toList();
    }

    private List<DraftDetailResponse.CirculationSummary> toCirculationSummaries(Draft draft) {
        return draft.getCirculations().stream()
                .map(circulation -> new DraftDetailResponse.CirculationSummary(
                        circulation.getViewer().getId(),
                        circulation.getViewer().getEmpName(),
                        circulation.getReadAt()
                ))
                .toList();
    }

    private DraftDetailResponse.LeaveDraftDetail toLeaveDetail(Draft draft) {
        if (!(draft instanceof LeaveDraft leaveDraft)) return null;

        return new DraftDetailResponse.LeaveDraftDetail(
                leaveDraft.getStartAt(),
                leaveDraft.getEndAt(),
                leaveDraft.getLeaveType(),
                leaveDraft.getReservedHours()
        );
    }

    private DraftDetailResponse.BusinessTripDraftDetail toBusinessTripDetail(Draft draft) {
        if (!(draft instanceof BusinessTripDraft businessTripDraft)) return null;

        return new DraftDetailResponse.BusinessTripDraftDetail(
                businessTripDraft.getStartAt(),
                businessTripDraft.getEndAt(),
                businessTripDraft.getDestination(),
                businessTripDraft.getPurpose(),
                businessTripDraft.getParticipants().stream()
                        .map(participant -> toEmpSummary(participant.getEmp()))
                        .toList()
        );
    }

    private DraftDetailResponse.SalesDraftDetail toSalesDetail(Draft draft) {
        if (!(draft instanceof SalesDraft salesDraft)) return null;

        return new DraftDetailResponse.SalesDraftDetail(
                salesDraft.getFranchise().getId(),
                salesDraft.getFranchise().getFranchiseName(),
                salesDraft.getReportMonth(),
                salesDraft.getSalesAmount()
        );
    }

    @Nullable
    private Long findSourceDraftId(Draft draft) {
        if (!isCancelDraft(draft)) return null;

        return draftRepository.findBySourceKey(draft.getSourceKey()).stream()
                .filter(source -> !Objects.equals(source.getId(), draft.getId()))
                .filter(source -> !isCancelDraft(source))
                .map(Draft::getId)
                .findFirst()
                .orElse(null);
    }

    @Nullable
    private Draft findCancellationDraft(Draft draft) {
        if (isCancelDraft(draft)) return draft;

        return draftRepository.findBySourceKey(draft.getSourceKey()).stream()
                .filter(this::isCancelDraft)
                .findFirst()
                .orElse(null);
    }

    private boolean isCancelDraft(Draft draft) {
        return draft instanceof LeaveCancelDraft || draft instanceof BusinessTripCancelDraft;
    }
}
