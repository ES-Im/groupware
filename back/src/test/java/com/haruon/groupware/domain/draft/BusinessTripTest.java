package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.event.byBusinessTripApprove.BusinessTripApprovedEvent;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.draft.BusinessTripDraft.createDraft;
import static com.haruon.groupware.domain.draft.BusinessTripDraft.createSubmitted;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BusinessTripTest {

    @Test
    @DisplayName("미상신 기안서 생성 성공 테스트")
    void create_draft_success() {
        Emp drafter = getApprovedEmp();
        Emp participant = getApprovedEmp("202601001", "test_Emp");

        String title = "test";
        String content = "test";
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        List<Emp> participants = List.of(drafter, participant);

        BusinessTripDraft draft = createDraft(
                drafter, title, content, startAt, endAt, destination, purpose, participants, null
        );

        assertThat(draft).extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt,
                BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose
        ).containsExactly(
                startAt, endAt,
                destination, purpose
        );

        assertThat(participants.size()).isEqualTo(2);
        assertThat(draft.getSourceKey()).isNotNull();
    }

    @Test
    @DisplayName("상신 기안서 생성 성공 테스트")
    void create_submitted_success() {
        Emp drafter = getApprovedEmp();
        Emp approver = getApprovedEmp("202601002", "test_Emp");

        String title = "test";
        String content = "test";
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        List<Emp> participants = List.of(drafter);
        ApproversParam approversParam = new ApproversParam(ApprovalRole.APPROVER, 1, approver);

        LocalDateTime submittedAt = LocalDateTime.of(2026,3,1,0,0,0);

        BusinessTripDraft submitted = createSubmitted(
                drafter, title, content, startAt, endAt, destination, purpose, participants, List.of(approversParam), submittedAt
        );

        assertThat(submitted).extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt,
                BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose,
                BusinessTripDraft::getSubmittedAt
        ).containsExactly(
                startAt, endAt,
                destination, purpose,
                submittedAt
        );

        assertThat(participants.size()).isEqualTo(1);
        assertThat(submitted.getParticipants()).singleElement().extracting(BusinessTripParticipant::getEmp).isEqualTo(drafter);
        Assertions.assertNotNull(submitted.getApproval());
        assertThat(submitted.getApproval().getApprovers()).singleElement().extracting(Approver::getEmp).isEqualTo(approver);
        assertThat(submitted.getSourceKey()).isNotNull();
    }

    @Test
    @DisplayName("출장 참여자가 없으면 출장 미상신 기안서를 상신할 수 없다.")
    void create_submitted_without_participants_fail() {
        List<Emp> emptyList = List.of();

        BusinessTripDraft draft = getDraft(emptyList);
        List<ApproversParam> approvers = List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp()));

        assertThatThrownBy(() ->
                draft.submit(LocalDateTime.of(2026,1,1,0,0,0), approvers)
        ).hasMessage("참가자가 0명이 될 수 없다.");
    }

    @Test
    @DisplayName("출장기안서 수정성공 테스트")
    void edit_businessTrip_draft() {
        BusinessTripDraft draft = getDraft(List.of(getApprovedEmp("202601001", "참가1")));
        LocalDateTime startAt = LocalDateTime.of(2026,5,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,5,2,0,0,0);
        String destination = "editDest";
        String purpose = "edit";
        draft.editBusinessTripDraft("title", "contetn", startAt, endAt, destination, purpose);

        assertThat(draft).extracting(
                BusinessTripDraft::getStartAt, BusinessTripDraft::getEndAt, BusinessTripDraft::getDestination, BusinessTripDraft::getPurpose
        ).containsExactly(
                startAt, endAt, destination, purpose
        );
    }

    private static Stream<Arguments> editBTArguments() {
        BusinessTripDraft draft = getDraft(List.of(getApprovedEmp("202601001", "참가1")));
        BusinessTripDraft submitted = getSubmitted(List.of(getApprovedEmp("202601001", "참가1")));

        LocalDateTime startAt = LocalDateTime.of(2026,5,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,5,2,0,0,0);
        String destination = "editDest";
        String purpose = "edit";
        draft.editBusinessTripDraft("title", "contetn", startAt, endAt, destination, purpose);

        return Stream.of(
                Arguments.of("종료시간은 시작시간보다 이를 수 없음",
                        EditBusinessTripDraft.builder()
                                .draft(draft)
                                .startAt(startAt)
                                .endAt(startAt.minusHours(3))
                        .build()
                ),Arguments.of("목적지는 빈 값이 될 수 없음",
                        EditBusinessTripDraft.builder()
                                .draft(draft)
                                .destination(" ")
                        .build()
                ),Arguments.of("출장목적은 빈 값이 될 수 없음",
                        EditBusinessTripDraft.builder()
                                .draft(draft)
                                .purpose(" ")
                        .build()
                ),Arguments.of("미상신 문서만 수정가능",
                        EditBusinessTripDraft.builder()
                                .draft(submitted)
                                .startAt(startAt)
                                .endAt(endAt)
                                .destination(destination)
                                .purpose(purpose)
                        .build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editBTArguments")
    @DisplayName("출장기안서 수정 실패 케이스")
    void edit_businessTrip_fails(String description, EditBusinessTripDraft params) {
        assertThatThrownBy(() ->
                params.draft.editBusinessTripDraft(
                        null, null,
                        params.startAt(), params.endAt(), params.destination(), params.purpose()
                )
        ).hasMessage(description);
    }

    @Builder
    private record EditBusinessTripDraft(
            BusinessTripDraft draft,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose
    ) {}
    
    @Test
    @DisplayName("참여자 수정 테스트")
    void changeParticipants() {
        BusinessTripDraft BusinessTrip = getDraft(List.of(getApprovedEmp("202601001", "participant1"), getApprovedEmp("202601002", "participant2")));
        Emp existedEmp = BusinessTrip.getParticipants().getFirst().getEmp();
        Emp newEmp = getApprovedEmp("202601007", "participant3");
        Emp deleteTargetEmp = BusinessTrip.getParticipants().get(1).getEmp();
        List<Emp> newParticipants = List.of(existedEmp, newEmp);

        BusinessTrip.changeParticipants(newParticipants);

        List<Emp> existedEmps = BusinessTrip.getParticipants().stream().map(BusinessTripParticipant::getEmp).toList();

        assertThat(existedEmps.containsAll(List.of(existedEmp, newEmp))).isTrue();

        assertThat(existedEmps.contains(deleteTargetEmp)).isFalse();
    }
    @Test
    @DisplayName("상신된 출장신청서는 참여자를 수정 할수 없다")
    void changeParticipants_when_submitted_fail() {
        BusinessTripDraft BusinessTrip = getSubmitted(List.of(getApprovedEmp("202601001", "participant1"), getApprovedEmp("202601002", "participant2")));

        assertThatThrownBy(() ->
                BusinessTrip.changeParticipants(List.of(BusinessTrip.getParticipants().getFirst().getEmp(), getApprovedEmp("202601007", "participant3")))
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("출장 참여자가 없으면 출장 상신 기안서를 생성할 수 없다.")
    void createSubmitted_without_participants_fail() {
        List<Emp> emptyList = List.of();

        assertThatThrownBy(() ->
                getSubmitted(emptyList)
        ).hasMessage("참가자가 0명이 될 수 없다.");
    }

    @Test
    @DisplayName("미상신 기안서는 참여자를 지정하지 않아도 생성가능")
    void createDraft_without_participants() {
        List<Emp> emptyList = List.of();

        getDraft(emptyList);
    }




    private static Stream<Arguments> initDraftFailsArguments() {
        LocalDateTime startAt = LocalDateTime.of(2026,4, 4, 0, 0, 0);
        LocalDateTime endAt = startAt.plusHours(3);
        String destination = "test";
        String purpose = "test";
        List<Emp> participants = List.of(getApprovedEmp());

        return Stream.of(
                Arguments.of(
                        "출장 시작시간을 누락하면 생성실패",
                        DraftParam.builder()
                                .startAt(null)
                                .endAt(endAt)
                                .destination(destination)
                                .purpose(purpose)
                                .participants(participants)
                        .build()
                ),Arguments.of(
                        "출장 종료시간을 누락하면 생성실패",
                        DraftParam.builder()
                                .startAt(startAt)
                                .endAt(null)
                                .destination(destination)
                                .purpose(purpose)
                                .participants(participants)
                        .build()
                ),Arguments.of(
                        "출장 시작시간이 종료시간보다 늦으면 생성실패",
                        DraftParam.builder()
                                .startAt(startAt)
                                .endAt(startAt.minusHours(1))
                                .destination(destination)
                                .purpose(purpose)
                                .participants(participants)
                                .build()
                ),Arguments.of(
                        "출장 목적지가 빈값이면 생성실패",
                        DraftParam.builder()
                                .startAt(startAt)
                                .endAt(endAt)
                                .destination(" ")
                                .purpose(purpose)
                                .participants(participants)
                        .build()
                ),Arguments.of(
                        "출장 목적이 빈값이면 생성실패",
                        DraftParam.builder()
                                .startAt(startAt)
                                .endAt(endAt)
                                .destination(destination)
                                .purpose(" ")
                                .participants(participants)
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("initDraftFailsArguments")
    @DisplayName("출장 기안서 init 실패 케이스")
    void init_businessTrip_fail(String description, DraftParam param) {
        assertThatThrownBy(() ->
            createDraft(
                    getApprovedEmp(), "title", "content",
                    param.startAt(), param.endAt(), param.destination(), param.purpose(),
                    List.of(), List.of()
            )
        ).isInstanceOf(Exception.class);
    }

    private static Stream<Arguments> editDraftArguments() {
        LocalDateTime earlyEndAt = LocalDateTime.of(2025, 4, 4, 0, 0, 0);

        return Stream.of(
                Arguments.of("종료시간은 시작시간보다 이를 수 없음",
                        DraftParam.builder().endAt(earlyEndAt).build()
                ),Arguments.of("목적지는 빈 값이 될 수 없음",
                        DraftParam.builder().destination(" ").build()
                ),Arguments.of("출장목적은 빈 값이 될 수 없음",
                        DraftParam.builder().purpose(" ").build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editDraftArguments")
    @DisplayName("출장신청 기안 실패 케이스")
    void edit_businessTrip_fail(String expectedMessage, DraftParam params) {
        BusinessTripDraft draft = getDraft(List.of());

        assertThatThrownBy(() ->
            draft.editBusinessTripDraft(
                    null, null, params.startAt(), params.endAt(), params.destination(), params.purpose()
            )
        ).hasMessage(expectedMessage);
    }

    @Builder
    private record DraftParam(
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            List<Emp> participants
    ) {}

    @Test
    @DisplayName("출장기안서 승인이 마무리되면 출장승인 일정반영 이벤트가 발생한다.")
    void BusinessTrip_approve_event() {
        // given
        Emp drafter = getApprovedEmp("202601001", "drafter");
        Emp approver1 = getApprovedEmp("202601002", "approver1");
        Emp approver2 = getApprovedEmp("202601003", "approver2");
        ApproversParam approverParam1 = new ApproversParam(ApprovalRole.APPROVER, 1, approver1);
        ApproversParam approverParam2 = new ApproversParam(ApprovalRole.APPROVER, 2, approver2);
        String title = "title";
        String content = "content";
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 20,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 21, 0,0,0);

        String destination = "destination";
        String purpose = "purpose";
        List<Emp> participant = List.of(drafter);
        List<Long> participantIds = participant.stream().map(Emp::getId).toList();

        BusinessTripDraft submitted = BusinessTripDraft.createSubmitted(
                drafter, title, content, startAt, endAt, destination, purpose, participant, List.of(approverParam1, approverParam2), LocalDateTime.of(2026, 4, 16, 9, 0)
        );

        submitted.approve(approver1, LocalDateTime.of(2026, 4, 20,0,0,0));
        submitted.approve(approver2, LocalDateTime.of(2026, 4, 20,0,0,0));

        List<? extends DomainEvent> domainEvents = submitted.domainEvents();
        DomainEvent domainEvent = domainEvents.getFirst();
        assertThat(domainEvent).isExactlyInstanceOf(BusinessTripApprovedEvent.class);

        BusinessTripApprovedEvent businessTripApprovedEvent = (BusinessTripApprovedEvent) domainEvent;
        assertThat(businessTripApprovedEvent).extracting(
                BusinessTripApprovedEvent::sourceKey, BusinessTripApprovedEvent::drafterEmpId, BusinessTripApprovedEvent::title,
                BusinessTripApprovedEvent::content, BusinessTripApprovedEvent::startAt, BusinessTripApprovedEvent::endAt,
                BusinessTripApprovedEvent::destination, BusinessTripApprovedEvent::purpose, BusinessTripApprovedEvent::participantsId,
                BusinessTripApprovedEvent::scheduleType
        ).containsExactly(
                submitted.getSourceKey(), drafter.getId(), title,
                content, startAt, endAt,
                destination, purpose, participantIds, ScheduleType.BUSINESS_TRIP
        );
    }


    private static BusinessTripDraft getDraft(List<Emp> participants) {
        Emp drafter = getApprovedEmp();

        String title = "test";
        String content = "test";
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";

        return createDraft(
                drafter, title, content, startAt, endAt, destination, purpose, participants, null
        );
    }

    private static BusinessTripDraft getSubmitted(List<Emp> participants) {
        Emp drafter = getApprovedEmp();
        Emp approver = getApprovedEmp("202601002", "test_Emp");

        String title = "test";
        String content = "test";
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        ApproversParam approversParam = new ApproversParam(ApprovalRole.APPROVER, 1, approver);

        LocalDateTime submittedAt = LocalDateTime.of(2026,3,1,0,0,0);

        return createSubmitted(
                drafter, title, content, startAt, endAt, destination, purpose, participants, List.of(approversParam), submittedAt
        );
    }

}