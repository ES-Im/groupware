package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.*;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.Approver;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Slf4j
@TestIntegrationConfig
record BusinessTripDraftManagementTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        ScheduleRepository scheduleRepository,
        BusinessTripDraftManagement businessTripDraftManagement,
        EmpRepository empRepository,
        EntityManager entityManager
) {


    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        draftRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @Transactional
    @DisplayName("출장신청서 테스트 - 미상신기안서 생성 테스트")
    void createDraft_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approver = saveApprovedEmp(empRepository, "202601002", "approver");
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        Set<Emp> participants = Set.of(drafter, approver);

        Draft draft = createDraft(drafter, startAt, endAt, destination, purpose, participants);

        assertInstanceOf(BusinessTripDraft.class, draft);

        entityManager.flush();
        entityManager.clear();

        BusinessTripDraft foundDraft = (BusinessTripDraft) draftRepository.findById(draft.getId())
                .orElseThrow();

        assertThat(foundDraft).as("출장신청 필드 확인").extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt,
                BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose
        ).containsExactly(
                startAt, endAt, destination, purpose
        );

        assertNotNull(draft.getSourceKey());

        (foundDraft).getParticipants().forEach(participant -> assertThat(participant.getEmp()).isIn(participants));
    }
    
    @Test
    @Transactional
    @DisplayName("출장신청서 테스트 - 상신기안서 생성 테스트")
    void createSubmitted_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approver = saveApprovedEmp(empRepository, "202601002", "approver");
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        Set<Emp> participants = Set.of(drafter, approver);

        Draft draft = createSubmittedDraft(drafter, approver, startAt, endAt, destination, purpose, participants);
        assertInstanceOf(BusinessTripDraft.class, draft);

        entityManager.flush();
        entityManager.clear();

        BusinessTripDraft foundDraft = (BusinessTripDraft) draftRepository.findById(draft.getId())
                .orElseThrow();

        assertThat(foundDraft).as("출장신청 필드 확인").extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt,
                BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose
        ).containsExactly(
                startAt, endAt, destination, purpose
        );

        assertNotNull(draft.getSourceKey());
        assertNotNull(draft.getApproval());
        assertNotNull(draft.getSubmittedAt());
        assertThat(approver).isIn(draft.getApproval().getApprovers().stream().map(Approver::getApprover).toList());

        (foundDraft).getParticipants().forEach(participant -> assertThat(participant.getEmp()).isIn(participants));
    }

    @Test
    @Transactional
    @DisplayName("출장신청서 테스트 - 상신 전, 출장신청서를 수정할 수 있다.")
    void updateDraft_before_submit_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approver = saveApprovedEmp(empRepository, "202601002", "approver");
        LocalDateTime editedStartAt = LocalDateTime.of(2026,4,2,0,0,0);
        LocalDateTime editedEndAt = LocalDateTime.of(2026,4,5,0,0,0) ;
        String editedDestination = "edited_test";
        String editedPurpose ="edited_test";
        Emp otherParticipant = saveApprovedEmp(empRepository, "202601004", "otherParticipant");

        Draft draft = createDraft(
                drafter,
                LocalDateTime.of(2026,4,1,0,0,0),
                LocalDateTime.of(2026,4,4,0,0,0),
                "test",
                "test",
                Set.of(drafter, approver)
        );

        businessTripDraftManagement.updateDraft(
                BusinessTripDraftUpdateRequest.builder()
                        .param(
                                CommonDraftUpdateRequest.builder()
                                        .draftId(draft.getId())
                                        .drafterId(drafter.getId())
                                        .build()
                        )
                        .startAt(editedStartAt)
                        .endAt(editedEndAt)
                        .destination(editedDestination)
                        .purpose(editedPurpose)
                .build()
        );

        businessTripDraftManagement.updateParticipants(
                draft.getId(), drafter.getId(), Set.of(otherParticipant.getId())
        );

        entityManager.flush();
        entityManager.clear();

        BusinessTripDraft foundDraft = (BusinessTripDraft) draftRepository.findById(draft.getId())
                .orElseThrow();

        assertThat(foundDraft).as("수정된 필드 검사").extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt,
                BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose
        ).containsExactly(
                editedStartAt, editedEndAt, editedDestination, editedPurpose
        );

        assertThat(otherParticipant.getId()).as("수정된 출장 참가자").isIn(foundDraft
                .getParticipants().stream()
                .map(participant -> participant.getEmp().getId()).toList()
        );

    }

    private Draft createDraft(
            Emp drafter,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            Set<Emp> participants
    ) {
        businessTripDraftManagement.createDraft(
                BusinessTripDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test")
                                .content("test")
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

        return draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
    }

    private Draft createSubmittedDraft(
            Emp drafter, Emp approver,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            Set<Emp> participants
    ) {
        businessTripDraftManagement.createSubmitted(
                BusinessTripDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(drafter.getId())
                                .title("test")
                                .content("test")
                                .approvers(List.of(
                                        new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1)
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

        return draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
    }

}