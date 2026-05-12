package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CancelDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.BusinessTripCancelDraft;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static java.util.Set.of;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
record BusinessTripCancelDraftManagementTest(
        BusinessTripCancelDraftManagement businessTripCancelDraftManagement,

        ScheduleRepository scheduleRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        DraftRepository draftRepository,
        EmpLeaveRepository empLeaveRepository,

        BusinessTripDraftManagement businessTripDraftManagement
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
    @DisplayName("결재완료된 출장 기안서에 대해 취소기안을 올릴 수 있다.")
    void createCancelDraft_ForBusinessTrip_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp participant = saveApprovedEmp(empRepository, "202601091", "participant91");
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver2");
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String destination = "destination";
        String purpose = "purpose";
        Set<Emp> participants = of(drafter, participant);
        Draft businessTrip = createAndApproveBTDraft(drafter, startAt, endAt, destination, purpose, participants);

        String sourceKey = businessTrip.getSourceKey();
        businessTripCancelDraftManagement.createDraft(
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

        BusinessTripCancelDraft draft = (BusinessTripCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof BusinessTripCancelDraft)
                .findFirst()
                .orElseThrow();

        assertThat(draft.getSourceKey())
                .as("출장 취소 기안서는 기존 출장건과 sourceKey가 동일하다")
                .isEqualTo(sourceKey);

    }
    @Test
    @DisplayName("결재완료된 출장 기안서에 대해 취소기안을 올릴 수 있다.")
    void createCancelDraftSubmit_ForBusinessTrip_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp participant = saveApprovedEmp(empRepository, "202601091", "participant91");
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver2");
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String destination = "destination";
        String purpose = "purpose";
        Set<Emp> participants = of(drafter, participant);
        Draft businessTrip = createAndApproveBTDraft(drafter, startAt, endAt, destination, purpose, participants);

        String sourceKey = businessTrip.getSourceKey();
        businessTripCancelDraftManagement.createSubmitted(
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

        BusinessTripCancelDraft draft = (BusinessTripCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof BusinessTripCancelDraft)
                .findFirst()
                .orElseThrow();

        assertThat(draft.getSourceKey())
                .as("출장 취소 기안서는 기존 출장건과 sourceKey가 동일하다")
                .isEqualTo(sourceKey);
        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);

    }


    @Test
    @DisplayName("결재완료된 출장 기안서에 대해 취소기안을 올릴 수 있다.")
    void approve_CancelDraft_ForBusinessTrip_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp participant = saveApprovedEmp(empRepository, "202601091", "participant91");
        Emp approver = saveApprovedEmp(empRepository, "202602333", "approver2");
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String destination = "destination";
        String purpose = "purpose";
        Set<Emp> participants = of(drafter, participant);
        Draft businessTrip = createAndApproveBTDraft(drafter, startAt, endAt, destination, purpose, participants);

        String sourceKey = businessTrip.getSourceKey();
        businessTripCancelDraftManagement.createDraft(
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

        BusinessTripCancelDraft draft = (BusinessTripCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof BusinessTripCancelDraft)
                .findFirst()
                .orElseThrow();

        businessTripCancelDraftManagement.approve(draft.getId(), approver.getId(), LocalDateTime.of(2026,10,1,0,0,0));

        BusinessTripCancelDraft foundDraft = (BusinessTripCancelDraft) draftRepository.findBySourceKey(sourceKey).stream()
                .filter(d -> d instanceof BusinessTripCancelDraft)
                .findFirst()
                .orElseThrow();

        assertThat(foundDraft.getApproval().getStatus())
                .isEqualTo(ApprovalStatus.APPROVED);

    }

    private Draft createAndApproveBTDraft(
            Emp drafter,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            Set<Emp> participants
    ) {

        Emp approver1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        businessTripDraftManagement.createSubmitted(
                BusinessTripDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test")
                                .content("test")
                                .approvers(List.of(
                                        new ApproversRequest(approver1.getId(), ApprovalRole.APPROVER, 1)
                                ))
                                .submittedAt(LocalDateTime.of(2026,3,1,0,0,0))
                                .build()
                        )
                        .startAt(startAt)
                        .endAt(endAt)
                        .destination(destination)
                        .purpose(purpose)
                        .participantIds(participants.stream()
                                .map(AbstractEntity::getId)
                                .collect(Collectors.toSet())
                        )
                        .build()
        );

        Draft draft = draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
        businessTripDraftManagement.approve(draft.getId(), approver1.getId(), LocalDateTime.of(2026,3,1,0,0,0));

        return draftRepository.findById(draft.getId()).orElseThrow();
    }
}