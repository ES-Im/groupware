package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.provided.LeaveDraftManagement;
import com.haruon.groupware.application.draft.required.LeaveDraftRepository;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.LeaveDraftUpdateRequest;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.draft.*;
import com.haruon.groupware.application.exception.empInfo.EmpAnnualLeaveNotFoundException;
import com.haruon.groupware.application.exception.empInfo.UnsupportedLeaveTypeException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static java.time.Duration.between;

@Service
@Transactional
public class LeaveDraftService extends CommonDraftService implements LeaveDraftManagement {

    private final LeaveDraftRepository leaveDraftRepository;
    private final EmpLeaveRepository empLeaveRepository;
    private final CompanyPolicyPort policyPort;

    private final Set<LeaveType> DEDUCTIBLE_LEAVE_TYPES = Set.of(
            LeaveType.ANNUAL, LeaveType.SPECIAL, LeaveType.COMPENSATORY
    );

    private final Set<LeaveType> REQUESTABLE_LEAVE_TYPES = Set.of(
            LeaveType.ANNUAL, LeaveType.SICK, LeaveType.OFFICIAL, LeaveType.COMPENSATORY, LeaveType.SPECIAL
    );

    public LeaveDraftService(
            EmpRepository empRepository,
            LeaveDraftRepository leaveDraftRepository,
            CompanyPolicyPort policyPort,
            EmpLeaveRepository empLeaveRepository,
            FileStorage fileStorage
    ) {
        super(empRepository, leaveDraftRepository, fileStorage);
        this.leaveDraftRepository = leaveDraftRepository;
        this.policyPort = policyPort;
        this.empLeaveRepository = empLeaveRepository;
    }

    @Override
    public void createDraft(LeaveDraftCreateRequest req) {
        long usedHours = getValidatedUsedHours(
                req.param().empId(),
                req.startAt(),
                req.endAt(),
                req.leaveType(),
                null
        );

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());

        LeaveDraft draft = LeaveDraft.createDraft(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.startAt(),
                req.endAt(),
                req.leaveType(),
                approvers,
                usedHours
        );

        leaveDraftRepository.save(draft);
    }

    @Override
    public void createSubmitted(LeaveDraftCreateRequest req) {
        long usedHours = getValidatedUsedHours(
                req.param().empId(),
                req.startAt(),
                req.endAt(),
                req.leaveType(),
                null
        );

        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());

        LeaveDraft draft = LeaveDraft.createSubmitted(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.startAt(),
                req.endAt(),
                req.leaveType(),
                approvers,
                submittedAt,
                usedHours
        );

        leaveDraftRepository.save(draft);
    }

    @Override
    public void updateDraft(LeaveDraftUpdateRequest req) {
        LeaveDraft leaveDraft = getLeaveDraft(req.param().draftId(), req.param().drafterId());

        String editedTitle = req.param().title() != null ? req.param().title() : leaveDraft.getTitle();
        String editedContent = req.param().content() != null ? req.param().content() : leaveDraft.getContent();
        LocalDateTime editedStartAt = req.startAt() != null ? req.startAt() : leaveDraft.getStartAt();
        LocalDateTime editedEndAt = req.endAt() != null ? req.endAt() : leaveDraft.getEndAt();
        LeaveType editedLeaveType = req.leaveType() != null ? req.leaveType() : leaveDraft.getLeaveType();

        long usedHours = getValidatedUsedHours(
                leaveDraft.getEmp().getId(),
                editedStartAt,
                editedEndAt,
                editedLeaveType,
                leaveDraft.getId()
        );

        leaveDraft.editLeaveDraft(
                editedTitle,
                editedContent,
                editedStartAt,
                editedEndAt,
                editedLeaveType,
                usedHours
        );
    }

    @Override
    public void approve(long draftId, long approverId, LocalDateTime approvedAt) {
        LeaveDraft draft = (LeaveDraft) findDraftByDraftId(draftId);
        Emp approver = findActiveEmpById(approverId);

        draft.approve(approver, approvedAt);

        if (draft.getApproval().getStatus().equals(ApprovalStatus.APPROVED)) {
            reflectUsage(draft);
        }
        leaveDraftRepository.save(draft);
    }

    private void reflectUsage(LeaveDraft draft) {
        long drafterId = draft.getEmp().getId();

        double reservedDays = draft.getReservedHours() / (double) policyPort.getWorkHours();
        LeaveType leaveType = draft.getLeaveType();

        if(DEDUCTIBLE_LEAVE_TYPES.contains(leaveType)) {
            EmpLeave empLeave = empLeaveRepository.findByEmpIdAndGrantYear(drafterId, draft.getStartAt().getYear())
                    .orElseThrow(EmpAnnualLeaveNotFoundException::new);

            switch (leaveType) {
                case ANNUAL -> empLeave.useAnnualDays(reservedDays);
                case SPECIAL -> empLeave.useSpecialDays(reservedDays);
                case COMPENSATORY -> empLeave.useCompensatoryDays(reservedDays);
                case HOURLY, SICK, OFFICIAL -> throw new UnsupportedLeaveTypeException();

            }
        }
    }

    private LeaveDraft getLeaveDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof LeaveDraft leaveDraft)) {
            throw new DraftTypeMismatchException();
        }

        return leaveDraft;
    }

    private long getValidatedUsedHours(
            long empId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType,
            @Nullable Long currentDraftId
    ) {
        long usedHours = calculateUsedHours(startAt, endAt, leaveType);

        if(!DEDUCTIBLE_LEAVE_TYPES.contains(leaveType)) {
            return usedHours;
        }

        if(usedHours <= 0) throw new PositiveValueRequiredException();
        if(usedHours % 4 != 0) throw new InvalidLeaveHourUnitException();

        EmpLeave empLeave = empLeaveRepository.findByEmpIdAndGrantYear(empId, startAt.getYear())
                .orElseThrow(EmpAnnualLeaveNotFoundException::new);

        validateUsageLeave(usedHours, leaveType, empLeave, currentDraftId);

        return usedHours;
    }


    // leave만 커스텀 예외로 처리하면 다음으로 내려가면 됌
    private void validateUsageLeave(
            Long usedHours,
            LeaveType leaveType,
            EmpLeave emp,
            @Nullable Long currentDraftId
    ) {
        double usedDay = usedHours / (double) policyPort.getWorkHours();
        double reservedDays = getReservedDays(leaveType, emp, currentDraftId);

        boolean isAvailable = switch (leaveType) {
            case ANNUAL -> usedDay <= (emp.getAnnualBaseGrantDays() - emp.getAnnualUsedDays() - reservedDays);
            case COMPENSATORY -> usedDay <= (emp.getCompensatoryGrantDays() - emp.getCompensatoryUsedDays() - reservedDays) ;
            case SPECIAL -> usedDay <= (emp.getSpecialGrantDays() - emp.getSpecialUsedDays() - reservedDays);
            default -> false;
        };

        if(!isAvailable) throw new InsufficientLeaveBalanceException();
    }

    private double getReservedDays(LeaveType leaveType, EmpLeave empLeave, @Nullable Long currentDraftId) {
        double reservedDays = 0;

        List<ApprovalStatus> approvalStatuses = List.of(ApprovalStatus.WAITING, ApprovalStatus.IN_PROGRESS);

        List<LeaveDraft> checkReservedHours;
        if(currentDraftId != null) {
            checkReservedHours = leaveDraftRepository.findByEmpIdAndLeaveTypeAndApproval_StatusInAndId_Not(
                    empLeave.getEmp().getId(), leaveType, approvalStatuses, currentDraftId
            );
        } else {
            checkReservedHours = leaveDraftRepository.findByEmpIdAndLeaveTypeAndApproval_StatusIn(
                    empLeave.getEmp().getId(), leaveType, approvalStatuses
            );
        }

        for (LeaveDraft checkReservedDay : checkReservedHours) {
            reservedDays += checkReservedDay.getReservedHours() / (double) policyPort.getWorkHours();
        }
        return reservedDays;
    }

    private long calculateUsedHours(
            LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType
    ) {

        if(!REQUESTABLE_LEAVE_TYPES.contains(leaveType)) throw new UnrequestableLeaveTypeException();

        validateLeaveTimes(startAt, endAt);

        LocalDate startDate = startAt.toLocalDate();
        LocalDate endDate = endAt.toLocalDate();

        if(startDate.equals(endDate)) {
            return calculateDailyUsedHours(
                    startAt.toLocalTime(), endAt.toLocalTime(), policyPort.getStartTime(), policyPort.getEndTime()
            );
        }

        long middleDays = ChronoUnit.DAYS.between(startDate, endDate) - 1L;

        long startDayHours = calculateDailyUsedHours(
                startAt.toLocalTime(), policyPort.getEndTime(), policyPort.getStartTime(), policyPort.getEndTime()
        );

        long endDayHours = calculateDailyUsedHours(
                policyPort.getStartTime(), endAt.toLocalTime(), policyPort.getStartTime(), policyPort.getEndTime()
        );

        return startDayHours + (policyPort.getWorkHours() * middleDays) + endDayHours;
    }

    private void validateLeaveTimes(LocalDateTime startAt, LocalDateTime endAt) {
        if(!(startAt.getMinute() == 0 && startAt.getSecond() == 0 && startAt.getNano() == 0))  throw new LeaveTimeNotOnTheHourException();
    }

    private long calculateDailyUsedHours(
            LocalTime leaveStartAt, LocalTime leaveEndAt,
            LocalTime companyStartAt, LocalTime companyEndAt
    ) {
        if(leaveEndAt.isBefore(leaveStartAt)) throw new EndTimeBeforeStartTimeException();
        if(leaveStartAt.isBefore(companyStartAt) || leaveEndAt.isAfter(companyEndAt)) throw new LeaveTimeOutsideCompanyHoursException();

        long calculatedHour = between(leaveStartAt, leaveEndAt).toHours();

        if(between(leaveStartAt, leaveEndAt).toHours() > 4) {
            calculatedHour -= policyPort.getBreakHours();
        }
        return calculatedHour;
    }


}
