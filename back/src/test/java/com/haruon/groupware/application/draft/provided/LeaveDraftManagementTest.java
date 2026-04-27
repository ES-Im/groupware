package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.*;
import com.haruon.groupware.application.empInfo.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.saveApprovedEmp;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestIntegrationConfig
record LeaveDraftManagementTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        LeaveDraftManagement leaveDraftManagement,
        EmpRepository empRepository,
        EntityManager entityManager,
        CompanyPolicyPort companyPolicyPort,
        EmpLeaveRepository empLeaveRepository,
        BusinessTripDraftManagement businessTripDraftManagement
) {

    @AfterEach
    void tearDown() {
        draftRepository.deleteAll();
        empLeaveRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @Transactional
    @DisplayName("연가신청 기안서 테스트 - 미상신 기안서 생성 테스트")
    void create_leave_Draft_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime threeDaysAfterStartAt =  LocalDateTime.of(2026,4,3,18,0,0);
        LeaveType leaveType = LeaveType.ANNUAL;

        Draft draft = createDraft(drafter, startAt, threeDaysAfterStartAt, leaveType);

        entityManager.flush();
        entityManager.clear();

        Draft foundDraft = draftRepository.findById(draft.getId()).orElseThrow();

        assertInstanceOf(LeaveDraft.class, foundDraft);

        assertThat((LeaveDraft) foundDraft).extracting(
                LeaveDraft::getStartAt, LeaveDraft::getEndAt, LeaveDraft::getLeaveType
        ).containsExactly(
                startAt, threeDaysAfterStartAt, leaveType
        );

        assertEquals(((LeaveDraft) foundDraft).getReservedHours(), companyPolicyPort.getWorkHours() * 3L);
        assertNotNull(draft.getSourceKey());
    }


    private Stream<Arguments> createDraftFailsArguments() {
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime endAt = startAt.plusDays(1).plusHours(companyPolicyPort.getWorkHours() + companyPolicyPort.getBreakHours());
        LeaveType leaveType = LeaveType.ANNUAL;

        return Stream.of(
                Arguments.of("휴무 신청 단위가 4시간(반차) 단위가 아니면 실패한다.",
                        startAt, endAt.minusHours(1), "휴가는 4시간 단위로만 사용할 수 있음"
                ), Arguments.of("휴무 시작일이 종료일보다 늦으면 실패한다.",
                        startAt, startAt.minusDays(1), "종료시간은 시작시간보다 이를 수 없음"
                ), Arguments.of("잔여 연가보다 사용연차가 더 많으면 실패한다",
                        startAt, startAt.plusMonths(2), "사용 휴가 일수가 잔여 휴가 일수를 초과"
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("createDraftFailsArguments")
    @Transactional
    @DisplayName("연가신청 기안서 테스트 - 미상신 기안서 생성 테스트")
    void create_leave_Draft_fail_cases(String description, LocalDateTime startAt, LocalDateTime endAt, String expectedMessage) {
        Emp drafter = saveApprovedEmp(empRepository);

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        entityManager.flush();
        entityManager.clear();

        assertThatThrownBy(() ->
                createDraft(drafter, startAt, endAt, LeaveType.ANNUAL)
        ).hasMessage(expectedMessage);
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - 차감휴가 타입 외에는 시간 제한 없이 기안을 할 수 있다.")
    void create_unDeductible_leave_type_in_any_condition() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        LocalDateTime startAt = LocalDateTime.of(2026, 4, 1, 9, 0, 0);
        LocalDateTime endAt = startAt.plusDays(100);
        LeaveDraft submittedDraft = (LeaveDraft) createSubmittedDraft(
                drafter,
                approver1, approver2,
                startAt,
                endAt,
                LeaveType.SICK
        );

        assertEquals(submittedDraft.getReservedHours(), companyPolicyPort.getWorkHours() * 100L);
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - REQUESTABLE_LEAVE_TYPES 외에는 휴가 신청을 할 수 없다.")
    void create_unquestionable_leave_type_fail() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        LocalDateTime startAt = LocalDateTime.of(2026, 4, 1, 9, 0, 0);
        LocalDateTime endAt = startAt.plusDays(100);

        assertThatThrownBy(() ->
                createSubmittedDraft(
                        drafter,
                        approver1, approver2,
                        startAt, endAt,
                        LeaveType.HOURLY
                )
        ).hasMessage("신청할 수 없는 휴가 타입");
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - 대상 사원의 올해 휴가 정보가 없으면 연가신청 기안을 할 수 없다.")
    void create_leave_Draft_without_emp_leave_info_this_year_fail() {
        Emp drafter = saveApprovedEmp(empRepository);

        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime threeDaysAfterStartAt =  LocalDateTime.of(2026,4,3,18,0,0);
        LeaveType leaveType = LeaveType.ANNUAL;

        assertThatThrownBy(() ->
                createDraft(drafter, startAt, threeDaysAfterStartAt, leaveType)
        ).hasMessage("조회된 연차정보가 없음");
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - 결재완료 되지 않은 결재건 포함해서 사용연차가 잔여연차를 초과하면 상신을 할 수 없다.")
    void create_leave_submitted_when_exceed_remain_leave_fail() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        createSubmittedDraft(
                drafter,
                approver1, approver2,
                LocalDateTime.of(2026, 4, 1, 9, 0, 0),
                LocalDateTime.of(2026, 4, 1, 18, 0, 0).plusDays(14),
                LeaveType.ANNUAL
        );

        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime oneDaysAfterStartAt =  LocalDateTime.of(2026,4,1,18,0,0);

        assertThatThrownBy(() ->
                createDraft(drafter, startAt, oneDaysAfterStartAt, LeaveType.ANNUAL)
        ).hasMessage("사용 휴가 일수가 잔여 휴가 일수를 초과");
    }

    @Test
    @Transactional
    @DisplayName("연가신청 기안서 테스트 - 연차 신청이 모두 승인나면, 사용한 연차가 사원 연차 정보에 반영 된다.")
    void create_annual_leave_submitted_success() {
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime threeDaysAfterStartAt =  LocalDateTime.of(2026,4,3,18,0,0);
        EmpLeave foundEmpLeave = createAndApproveLeaveDraft(LeaveType.ANNUAL, startAt, threeDaysAfterStartAt);

        assertEquals(3, foundEmpLeave.getAnnualUsedDays());
    }

    @Test
    @Transactional
    @DisplayName("연가신청 기안서 테스트 - 포상휴가 신청이 모두 승인나면, 사용한 연차가 사원 연차 정보에 반영 된다.")
    void create_compensatory_leave_submitted_success() {
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime threeDaysAfterStartAt =  LocalDateTime.of(2026,4,3,18,0,0);
        EmpLeave foundEmpLeave = createAndApproveLeaveDraft(LeaveType.COMPENSATORY, startAt, threeDaysAfterStartAt);

        assertEquals(3, foundEmpLeave.getCompensatoryUsedDays());
    }

    @Test
    @Transactional
    @DisplayName("연가신청 기안서 테스트 - 특휴 신청이 모두 승인나면, 사용한 연차가 사원 연차 정보에 반영 된다.")
    void create_special_leave_submitted_success() {
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime threeDaysAfterStartAt =  LocalDateTime.of(2026,4,3,18,0,0);
        EmpLeave foundEmpLeave = createAndApproveLeaveDraft(LeaveType.SPECIAL, startAt, threeDaysAfterStartAt);

        assertEquals(3, foundEmpLeave.getSpecialUsedDays());
    }

    private EmpLeave createAndApproveLeaveDraft(LeaveType type, LocalDateTime startAt, LocalDateTime threeDaysAfterStartAt) {
        Emp drafter = saveApprovedEmp(empRepository);

        int beforeGrantedAnnualLeaveDate = 15;

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, beforeGrantedAnnualLeaveDate
        );
        empLeaveRepository.save(empLeave);
        empLeave.adjustCompensatoryGrantDays(3.0);
        empLeave.adjustSpecialGrantDays(3.0);

        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmittedDraft(drafter, approver1, approver2, startAt, threeDaysAfterStartAt, type);

        entityManager.flush();
        entityManager.clear();

        Draft foundDraft = draftRepository.findById(draft.getId()).orElseThrow();
        leaveDraftManagement.approve(foundDraft.getId(), approver1.getId(), LocalDateTime.of(2026,4,1,0,0,0));
        leaveDraftManagement.approve(foundDraft.getId(), approver2.getId(), LocalDateTime.of(2026,4,1,5,0,0));

        entityManager.flush();
        entityManager.clear();

        return empLeaveRepository.findByEmpIdAndGrantYear(drafter.getId(), startAt.getYear()).orElseThrow();
    }
    
    @Test
    @DisplayName("연가신청 기안서 테스트 - 상신 전 연가신청서를 수정할 수 있다.")
    void update_draft_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime endAt =  LocalDateTime.of(2026,4,1,18,0,0);

        Draft draft = createDraft(drafter, startAt, endAt, LeaveType.ANNUAL);
        LocalDateTime editedEndAt = endAt.plusDays(1);

        leaveDraftManagement.updateDraft(
                LeaveDraftUpdateRequest.builder()
                        .param(
                                CommonDraftUpdateRequest.builder()
                                        .drafterId(drafter.getId())
                                        .draftId(draft.getId())
                                        .build()
                        )
                        .startAt(startAt)
                        .endAt(editedEndAt)
                        .leaveType(LeaveType.ANNUAL)
                        .build()
        );

        LeaveDraft foundDraft = (LeaveDraft) draftRepository.findById(draft.getId()).orElseThrow();

        assertThat(foundDraft.getEndAt()).isEqualTo(editedEndAt);
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - 결재완료 되지 않은 결재건 포함해서 사용연차가 잔여연차를 초과하면 기안서를 수정할 수 없다.")
    void update_draft_when_exceed_remain_leave_fail() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approver2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        EmpLeave empLeave = createEmpLeave(
                drafter, 2026, 15
        );
        empLeaveRepository.save(empLeave);

        createSubmittedDraft(
                drafter,
                approver1, approver2,
                LocalDateTime.of(2026, 4, 1, 9, 0, 0),
                LocalDateTime.of(2026, 4, 1, 18, 0, 0).plusDays(13),
                LeaveType.ANNUAL
        );

        LocalDateTime startAt = LocalDateTime.of(2026,4,1,9,0,0);
        LocalDateTime oneDaysAfterStartAt =  LocalDateTime.of(2026,4,1,18,0,0);

        Draft targetDraft = createDraft(drafter, startAt, oneDaysAfterStartAt, LeaveType.ANNUAL);

        assertThatThrownBy(() ->
                leaveDraftManagement.updateDraft(
                        LeaveDraftUpdateRequest.builder()
                                .param(
                                        CommonDraftUpdateRequest.builder()
                                                .drafterId(drafter.getId())
                                                .draftId(targetDraft.getId())
                                                .build()
                                )
                                .startAt(startAt)
                                .endAt(oneDaysAfterStartAt.plusDays(1))
                                .leaveType(LeaveType.ANNUAL)
                                .build()
                )
        ).hasMessage("사용 휴가 일수가 잔여 휴가 일수를 초과");
    }

    @Test
    @DisplayName("연가신청 기안서 테스트 - 연가신청 타입이 아닌 다른 기안 타입을 연가신청형식으로 수정 할 수없다.")
    void update_leave_draft_when_other_type_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");

        businessTripDraftManagement.createDraft(
                BusinessTripDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test")
                                .content("test")
                                .build()
                        )
                        .startAt(LocalDateTime.of(2026,3,1,0,0,0))
                        .endAt(LocalDateTime.of(2026,3,3,0,0,0))
                        .destination("test")
                        .purpose("test")
                        .participantIds(Set.of(drafter.getId()))
                        .build()
        );

        Draft draft = draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();

        assertThatThrownBy(() ->
                leaveDraftManagement.updateDraft(
                        LeaveDraftUpdateRequest.builder()
                                .param(
                                        CommonDraftUpdateRequest.builder()
                                                .drafterId(drafter.getId())
                                                .draftId(draft.getId())
                                                .build()
                                )
                                .startAt(LocalDateTime.of(2026,5,1,9,0,0))
                                .endAt(LocalDateTime.of(2026,5,1,18,0,0))
                                .leaveType(LeaveType.ANNUAL)
                                .build()
                )
        ).hasMessage("연가신청기안서가 아님");
    }

    private Draft createDraft(
            Emp drafter,
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType
    ) {
        leaveDraftManagement.createDraft(
                LeaveDraftCreateRequest.builder()
                        .param(
                                CommonDraftCreateRequest.builder()
                                        .empId(drafter.getId())
                                        .title("test")
                                        .content("test")
                                .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .leaveType(leaveType)
                .build()

        );

        return draftRepository.findByEmp(drafter).stream()
                .max(Comparator.comparing(Draft::getCreatedAt))
                .orElseThrow();
    }

    private Draft createSubmittedDraft(
            Emp drafter, Emp approver1, Emp approver2,
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType
    ) {
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
                                        .submittedAt(LocalDateTime.of(2026,4,1,0,0,0))
                                        .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .leaveType(leaveType)
                        .build()
        );

        return draftRepository.findByEmp(drafter).stream()
                .max(Comparator.comparing(Draft::getCreatedAt))
                .orElseThrow();
    }

}