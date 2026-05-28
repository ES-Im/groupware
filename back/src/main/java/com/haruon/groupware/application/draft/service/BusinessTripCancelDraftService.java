package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.provided.BusinessTripCancelDraftManagement;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.CancelDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.DraftNotApprovedException;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.domain.draft.BusinessTripCancelDraft;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BusinessTripCancelDraftService extends CommonDraftService implements BusinessTripCancelDraftManagement {

    private final DraftRepository draftRepository;

    public BusinessTripCancelDraftService(
            EmpRepository empRepository,
            DraftRepository draftRepository,
            FileStorage fileStorage
    ) {
        super(empRepository, draftRepository, fileStorage);
        this.draftRepository = draftRepository;
    }

    @Override
    public void createDraft(CancelDraftCreateRequest req) {
        validateOriginalBusinessTripDraft(req.sourceKey());

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());

        BusinessTripCancelDraft draft = BusinessTripCancelDraft.createDraft(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.sourceKey(),
                approvers
        );

        draftRepository.save(draft);
    }

    @Override
    public void createSubmitted(CancelDraftCreateRequest req) {
        if(req.param().submittedAt() == null) throw new RequiredValueMissingException();
        validateOriginalBusinessTripDraft(req.sourceKey());

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());

        BusinessTripCancelDraft draft = BusinessTripCancelDraft.createSubmitted(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.sourceKey(),
                approvers,
                submittedAt
        );

        draftRepository.save(draft);
    }

    @Override
    public void approve(long draftId, long approverId, LocalDateTime approvedAt) {
        BusinessTripCancelDraft cancelDraft = getBusinessTripCancelDraftByDraftId(draftId);

        validateOriginalBusinessTripDraft(cancelDraft.getSourceKey());

        cancelDraft.approve(
                findActiveEmpById(approverId),
                approvedAt
        );

        draftRepository.save(cancelDraft);
    }

    private BusinessTripCancelDraft getBusinessTripCancelDraftByDraftId(long draftId) {
        Draft draft = draftRepository.findById(draftId)
                .orElseThrow(DraftNotFoundException::new);

        if (!(draft instanceof BusinessTripCancelDraft cancelDraft)) {
            throw new DraftTypeMismatchException();
        }

        return cancelDraft;
    }

    private void validateOriginalBusinessTripDraft(String sourceKey) {
        if(sourceKey == null) throw new RequiredValueMissingException();

        Draft draft = draftRepository.findBySourceKey(sourceKey)
                .stream()
                .filter(d -> d instanceof BusinessTripDraft)
                .findFirst()
                .orElseThrow(DraftTypeMismatchException::new);

        if(!draft.getApproval().getStatus().equals(ApprovalStatus.APPROVED)) {
            throw new DraftNotApprovedException();
        }
    }
}
