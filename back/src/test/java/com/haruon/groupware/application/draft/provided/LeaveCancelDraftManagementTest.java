package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.CancelDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.LeaveDraftCreateRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveCancelDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@TestIntegrationConfig
record LeaveCancelDraftManagementTest(
        LeaveCancelDraftManagement leaveCancelDraftManagement,
        ScheduleRepository scheduleRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        DraftRepository draftRepository,
        EmpLeaveRepository empLeaveRepository,
        ScheduleQueryRepository scheduleQueryRepository,
        LeaveDraftManagement leaveDraftManagement
) {

    private static final LocalDate BASE_DATE = LocalDate.of(2100, 5, 1);
    private static final LocalTime START_TIME = LocalTime.of(9, 0);
    private static final LocalTime END_TIME = LocalTime.of(18, 0);

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        draftRepository.deleteAll();
        empLeaveRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("결재완료된 연가 신청 기안서에 대해 취소기안을 올리 수 있다.")
    void createCancelDraft_ForLeave_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver000");

        int year = BASE_DATE.getYear();
        EmpLeave empLeave = createEmpLeave(drafter, year, 15);
        empLeaveRepository.save(empLeave);

        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        String sourceKey = getApprovedLeaveDraft.getSourceKey();
        leaveCancelDraftManagement.createDraft(
                CancelDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("cancelTitle")
                                .content("cancelContent")
                                .approvers(List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1)))
                                .build()
                        )
                        .sourceKey(sourceKey)
                        .build()
        );

        LeaveCancelDraft draft = (LeaveCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof LeaveCancelDraft)
                .findFirst()
                .orElseThrow();

        assertThat(draft.getSourceKey())
                .as("연가 취소 기안서는 기존 연가건과 sourceKey가 동일하다")
                .isEqualTo(sourceKey);
    }

    @Test
    @DisplayName("결재완료된 연가 신청 기안서에 대해 취소기안을 올리 수 있다.")
    void createCancelSubmit_ForLeave_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver000");

        int year = BASE_DATE.getYear();
        EmpLeave empLeave = createEmpLeave(drafter, year, 15);
        empLeaveRepository.save(empLeave);

        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        String sourceKey = getApprovedLeaveDraft.getSourceKey();
        leaveCancelDraftManagement.createSubmitted(
                CancelDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("cancelTitle")
                                .content("cancelContent")
                                .approvers(List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1)))
                                .submittedAt(LocalDateTime.of(2026,10,1,0,0,0))
                                .build()
                        )
                        .sourceKey(sourceKey)
                        .build()
        );

        LeaveCancelDraft draft = (LeaveCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof LeaveCancelDraft)
                .findFirst()
                .orElseThrow();

        assertThat(draft.getSourceKey())
                .as("연가 취소 기안서는 기존 연가건과 sourceKey가 동일하다")
                .isEqualTo(sourceKey);
        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);
    }

    @Test
    @DisplayName("취소기안이 승인되면 개인연차 정보가 연가기안에서 차감된 만큼 증가한다.")
    void recalculate_emp_leave_by_approve_cancelDraft() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver000");

        int year = BASE_DATE.getYear();
        EmpLeave empLeave = createEmpLeave(drafter, year, 15);
        EmpLeave beforeLeaveUse = empLeaveRepository.save(empLeave);

        log.info("beforeEmpLeave: {}", empLeave);   //  EmpLeave(grantYear=2100, annualBaseGrantDays=15.0, annualUsedDays=0.0)

        LeaveType annual = LeaveType.ANNUAL;
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        Draft getApprovedLeaveDraft = createAndApproveLeaveDraft(drafter, annual, startAt, endAt);

        log.info("getApprovedLeaveDraft: {}", getApprovedLeaveDraft);   // startAt=2100-05-01T09:00, endAt=2100-05-03T18:00, leaveType=ANNUAL, reservedHours=24)

        EmpLeave afterUseLeaveEmpLeave = empLeaveRepository.findByEmpIdAndGrantYear(drafter.getId(), year).orElseThrow();

        String sourceKey = getApprovedLeaveDraft.getSourceKey();
        leaveCancelDraftManagement.createSubmitted(
                CancelDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("cancelTitle")
                                .content("cancelContent")
                                .approvers(List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1)))
                                .submittedAt(LocalDateTime.of(2026,10,1,0,0,0))
                                .build()
                        )
                        .sourceKey(sourceKey)
                        .build()
        );

        LeaveCancelDraft draft = (LeaveCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof LeaveCancelDraft)
                .findFirst()
                .orElseThrow();

        leaveCancelDraftManagement.approve(draft.getId(), approver.getId(), LocalDateTime.of(2026,10,1,9,0,0));

        EmpLeave afterCancelEmpLeave = empLeaveRepository.findByEmpIdAndGrantYear(drafter.getId(), year).orElseThrow();


        log.info("afterUseLeaveEmpLeave: {}, afterCancelEmpLeave: {}",
                afterUseLeaveEmpLeave,  // EmpLeave(grantYear=2100, annualBaseGrantDays=15.0, annualUsedDays=3.0)
                afterCancelEmpLeave);   // EmpLeave(grantYear=2100, annualBaseGrantDays=15.0, annualUsedDays=0.0)

        assertThat(beforeLeaveUse.getAnnualUsedDays()).isEqualTo(afterCancelEmpLeave.getAnnualUsedDays());
        assertThat(afterUseLeaveEmpLeave.getAnnualUsedDays().equals(afterCancelEmpLeave.getAnnualUsedDays())).isFalse();
    }



    private Draft createAndApproveLeaveDraft(
            Emp drafter,
            LeaveType leaveType,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        int year = BASE_DATE.getYear();

        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        leaveDraftManagement.createSubmitted(
                LeaveDraftCreateRequest.builder()
                        .param(
                                CommonDraftCreateRequest.builder()
                                        .empId(drafter.getId())
                                        .title("test")
                                        .content("test")
                                        .approvers(List.of(
                                                new ApproversRequest(approver1.getId(), ApprovalRole.APPROVER, 1),
                                                new ApproversRequest(approver2.getId(), ApprovalRole.APPROVER, 2)
                                        ))
                                        .submittedAt(LocalDateTime.of(year, 4, 1, 0, 0))
                                        .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .leaveType(leaveType)
                        .build()
        );

        Draft draft = draftRepository.findByEmp(drafter).stream()
                .max(Comparator.comparing(Draft::getCreatedAt))
                .orElseThrow();

        leaveDraftManagement.approve(
                draft.getId(),
                approver1.getId(),
                LocalDateTime.of(year, 4, 1, 0, 0)
        );

        leaveDraftManagement.approve(
                draft.getId(),
                approver2.getId(),
                LocalDateTime.of(year, 4, 1, 5, 0)
        );

        return draftRepository.findById(draft.getId()).orElseThrow();
    }
}