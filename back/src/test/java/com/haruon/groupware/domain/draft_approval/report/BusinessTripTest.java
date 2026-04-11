package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft.createDraft;
import static com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft.createSubmitted;
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
        assertThat(submitted.getApproval().getApprovers()).singleElement().extracting(Approver::getEmp).isEqualTo(approver);
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


    @Test
    @DisplayName("미상신상태에서 출장 참여자를 추가 할 수 있다.")
    void add_participant_with_draft() {
        List<Emp> emptyList = List.of();

        BusinessTripDraft draft = getDraft(emptyList);
        Emp approvedEmp = getApprovedEmp();

        draft.addParticipant(approvedEmp);

        assertThat(draft.getParticipants()).singleElement().extracting(
                BusinessTripParticipant::getBusinessTripDraft, BusinessTripParticipant::getEmp
        ).containsExactly(
                draft, approvedEmp
        );
    }

    @Test
    @DisplayName("미상신상태에서 출장 참여자를 제외 할 수 있다.")
    void remove_participant_with_draft() {
        Emp emp = getApprovedEmp();
        BusinessTripDraft draft = getDraft(List.of(emp));

        draft.removeParticipant(emp);

        assertThat(draft.getParticipants()).isEmpty();
    }

    @Test
    @DisplayName("상신상태에서 출장 참여자를 추가하거나 제외할 수 없다.")
    void edit_participant_with_submitted_fail() {
        Emp emp1 = getApprovedEmp("202501001", "participant1");
        Emp emp2 = getApprovedEmp("202501002", "participant2");

        BusinessTripDraft submitted = getSubmitted(List.of(emp1));

        assertThatThrownBy(() ->
            submitted.addParticipant(emp2)
        ).hasMessage("미상신 문서만 수정가능");

        assertThatThrownBy(() ->
            submitted.removeParticipant(emp2)
        ).hasMessage("미상신 문서만 수정가능");
    }

    @Test
    @DisplayName("미상신상태에서 출장 참여자 정보없이 추가하거나 제외할 수 없다.")
    void edit_participant_with_draft_without_participant_fail() {
        Emp emp = getApprovedEmp();
        BusinessTripDraft draft = getDraft(List.of());

        assertThatThrownBy(() ->
                draft.removeParticipant(null)
        ).hasMessage("참여자는 null일 수 없음");

        assertThatThrownBy(() ->
                draft.addParticipant(null)
        ).hasMessage("참여자는 null일 수 없음");
    }

    @Test
    @DisplayName("출장 참여자가 아닌 참여자를 참여자에서 제할 수 없다.")
    void remove_participant_who_is_not_in_participant_fail() {
        BusinessTripDraft draft = getDraft(null);

        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                draft.removeParticipant(emp)
        ).hasMessage("해당 참여자가 없음");
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


    private BusinessTripDraft getDraft(List<Emp> participants) {
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

    private BusinessTripDraft getSubmitted(List<Emp> participants) {
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