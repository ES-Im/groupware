package com.haruon.groupware.application.draft.service.command;

import com.haruon.groupware.application.draft.provided.forCommand.LeaveCancelDraftManagement;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.required.LeaveCancelDraftRepository;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CancelDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.empInfo.leave.required.EmpLeaveRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.DraftNotApprovedException;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.application.exception.empInfo.leave.EmpAnnualLeaveNotFoundException;
import com.haruon.groupware.application.exception.empInfo.leave.UnsupportedLeaveTypeException;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveCancelDraft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class LeaveCancelDraftService extends CommonDraftService implements LeaveCancelDraftManagement {

    private final LeaveCancelDraftRepository leaveCancelDraftRepository;
    private final DraftRepository draftRepository;
    private final CompanyPolicyPort policyPort;
    private final EmpLeaveRepository empLeaveRepository;


    public LeaveCancelDraftService(
            LeaveCancelDraftRepository leaveCancelDraftRepository,
            EmpRepository empRepository,
            DraftRepository draftRepository,
            CompanyPolicyPort policyPort,
            EmpLeaveRepository empLeaveRepository
    ) {
        super(empRepository, draftRepository);
        this.leaveCancelDraftRepository = leaveCancelDraftRepository;
        this.draftRepository = draftRepository;
        this.policyPort = policyPort;
        this.empLeaveRepository = empLeaveRepository;
    }

    private final Set<LeaveType> DEDUCTIBLE_LEAVE_TYPES = Set.of(
            LeaveType.ANNUAL, LeaveType.SPECIAL, LeaveType.COMPENSATORY
    );

    @Override
    public Long createDraft(Long drafterId, CancelDraftCreateRequest req) {
        validateOriginalLeaveDraft(req.sourceKey());

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(drafterId);
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());

        LeaveCancelDraft draft = LeaveCancelDraft.createDraft(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.sourceKey(),
                approvers
        );

        draftRepository.save(draft);

        return draft.getId();
    }

    @Override
    public Long createSubmitted(Long drafterId, CancelDraftCreateRequest req) {
        if(req.param().submittedAt() == null) throw new RequiredValueMissingException();
        validateOriginalLeaveDraft(req.sourceKey());

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(drafterId);
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());

        LeaveCancelDraft draft = LeaveCancelDraft.createSubmitted(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.sourceKey(),
                approvers,
                submittedAt
        );

        draftRepository.save(draft);

        return draft.getId();
    }

    @Override
    public void approve(long draftId, long approverId, LocalDateTime approvedAt) {
        LeaveCancelDraft cancelDraft = getLeaveCancelDraftById(draftId);

        LeaveDraft sourceDraft = (LeaveDraft) draftRepository.findBySourceKey(cancelDraft.getSourceKey())
                .stream()
                .filter(d -> d instanceof LeaveDraft)
                .findFirst()
                .orElseThrow(DraftTypeMismatchException::new);

        cancelDraft.approve(findActiveEmpById(approverId), approvedAt);

        if (cancelDraft.getApproval() != null && cancelDraft.getApproval().getStatus().equals(ApprovalStatus.APPROVED)) {
            reflectUsage(sourceDraft);
        }

        leaveCancelDraftRepository.save(cancelDraft);
    }

    private LeaveCancelDraft getLeaveCancelDraftById(long draftId) {
        Draft draft = draftRepository.findById(draftId).orElseThrow(DraftNotFoundException::new);

        if(!(draft instanceof LeaveCancelDraft leaveCancelDraft)) {
            throw new DraftTypeMismatchException();
        }

        return leaveCancelDraft;
    }

    private void reflectUsage(LeaveDraft draft) {
        long drafterId = draft.getEmp().getId();

        double reservedDays = draft.getReservedHours() / (double) policyPort.getWorkHours();
        LeaveType leaveType = draft.getLeaveType();

        if(DEDUCTIBLE_LEAVE_TYPES.contains(leaveType)) {
            EmpLeave empLeave = empLeaveRepository.findByEmpIdAndGrantYear(drafterId, draft.getStartAt().getYear())
                    .orElseThrow(EmpAnnualLeaveNotFoundException::new);

            switch (leaveType) {
                case ANNUAL -> empLeave.restoreAnnualDays(reservedDays);
                case SPECIAL -> empLeave.restoreSpecialDays(reservedDays);
                case COMPENSATORY -> empLeave.restoreCompensatoryDays(reservedDays);
                case HOURLY, SICK, OFFICIAL -> throw new UnsupportedLeaveTypeException();

            }
        }
    }

    private void validateOriginalLeaveDraft(String sourceKey) {
        if(sourceKey == null) throw new RequiredValueMissingException();

        Draft draft = draftRepository.findBySourceKey(sourceKey)
                .stream()
                .filter(d -> d instanceof LeaveDraft)
                .findFirst()
                .orElseThrow(DraftTypeMismatchException::new);

        if(!(draft.getApproval() != null && draft.getApproval().getStatus().equals(ApprovalStatus.APPROVED))) {
            throw new DraftNotApprovedException();
        }
    }
}
