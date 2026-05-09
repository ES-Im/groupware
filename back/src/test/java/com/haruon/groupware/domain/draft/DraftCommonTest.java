package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import lombok.Builder;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmpWithoutDept;
import static org.assertj.core.api.Assertions.*;

class DraftCommonTest {

    @Test
    @DisplayName("Draft 임시저장 시 Approval, Approver이 같이 초기화된다.")
    void createDraft() {
        Emp emp = getApprovedEmp();
        Emp approver1 = getApprovedEmp("20260410", "approver1");

        GeneralDraft draft = GeneralDraft.createDraft(
                emp, "test", "test",
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, approver1))
        );
        Approval approval = draft.getApproval();
        Assertions.assertNotNull(approval);
        List<Approver> approvers = approval.getApprovers();

        assertThat(approvers.getFirst().getApproval()).isEqualTo(approval);
        assertThat(approval.getDraft()).isEqualTo(draft);
    }

    @Test
    @DisplayName("Approver 초기화 없이 Draft 임시저장할 수 있다.")
    void createDraftWithoutApprover() {
        Emp emp = getApprovedEmp();
        String title = "test";
        String content = "test";

        GeneralDraft draft = GeneralDraft.createDraft(emp, title, content, null);

        assertThat(draft.getApproval().getApprovers()).isEmpty();
    }

    @Test
    @DisplayName("Draft 기안상신 시 Approval, Approver이 같이 초기화된다.")
    void createSubmitted() {
        Emp emp = getApprovedEmp();
        Emp approver1 = getApprovedEmp("20260410", "approver1");
        LocalDateTime submittedAt = LocalDateTime.of(2026, 6, 6, 0, 0, 0);

        GeneralDraft draft = GeneralDraft.createSubmitted(
                emp, "test", "test",
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, approver1)),
                submittedAt
        );

        Approval approval = draft.getApproval();
        List<Approver> approvers = approval.getApprovers();

        assertThat(approvers.getFirst().getApproval()).isEqualTo(approval);
        assertThat(approval.getDraft()).isEqualTo(draft);
    }

    @Test
    @DisplayName("임시저장 기안 엔티티 생성시, approval의 상태는 상신전(Unsubmitted)이다")
    void unsubmittedStatus_When_Create_Draft() {
        GeneralDraft draft = getDraftWithApprovers();

        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.UNSUBMITTED);
    }

    @Test
    @DisplayName("상신된 기안 엔티티 생성시, approval의 상태는 결재대기중(WAITING)이다")
    void unsubmittedStatus_When_Create_Submitted() {
        GeneralDraft submitted = getSubmitted();

        assertThat(submitted.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);
    }


    private static Stream<Arguments> createFailArgument() {
        Emp approver = getApprovedEmp("202601001", "approver");
        return Stream.of(
                Arguments.of("제목이 Null이라면 기안할 수 없다.",
                        CreateDraftParam.builder()
                                .title(null)
                                .content("test")
                                .emp(approver)
                        .build()
                ),
                Arguments.of("제목이 빈값이라면 기안할 수 없다.",
                        CreateDraftParam.builder()
                                .title("")
                                .content("test")
                                .emp(approver)
                        .build()
                ),
                Arguments.of("내용이  Null이라면 기안할 수 없다.",
                        CreateDraftParam.builder()
                                .title("test")
                                .content(null)
                                .emp(approver)
                        .build()
                ),
                Arguments.of("내용이 빈값이라면 기안할 수 없다.",
                        CreateDraftParam.builder()
                                .title("test")
                                .content(" ")
                                .emp(approver)
                        .build()
                ),
                Arguments.of("기안자가 NULL이라면 기안할 수 없다.",
                        CreateDraftParam.builder()
                                .title("test")
                                .content("test")
                                .emp(null)
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("createFailArgument")
    @DisplayName("Draft/Sumitted 생성 공통 실패케이스")
    void create_fail(String description, CreateDraftParam param) {

        assertThatThrownBy(() ->
                GeneralDraft.createDraft(
                        param.emp(),
                        param.title(),
                        param.content(),
                        null
                )
        ).isInstanceOf(Exception.class);

        LocalDateTime submittedAt = LocalDateTime.of(2026, 6, 6, 0, 0, 0);
        assertThatThrownBy(() ->
            GeneralDraft.createSubmitted(
                    param.emp(),
                    param.title(),
                    param.content(),
                    List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp())),
                    submittedAt)
        ).isInstanceOf(Exception.class);
    }

    @Builder
    private record CreateDraftParam(
            String title,
            String content,
            Emp emp
    ) {}

    @Test
    @DisplayName("Summited생성 시, 결재자(approver) 정보가 없으면 생성실패")
    void create_submitted_fail() {
        LocalDateTime submittedAt = LocalDateTime.of(2026, 6, 6, 0, 0, 0);

        assertThatThrownBy(() ->
                GeneralDraft.createSubmitted(
                        getApprovedEmp(),
                        "test",
                        "test",
                        List.of(),
                        submittedAt
                )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Draft임시저장 시 Approver 상세정보가 파라미터대로 생성된다")
    void createDraft_approver_detail() {
        Emp drafter = getApprovedEmp();
        Emp approver1 = getApprovedEmp("20260410", "approver1");
        Emp approver2 = getApprovedEmp("20260410", "approver2");

        GeneralDraft draft = GeneralDraft.createDraft(
                drafter,
                "test",
                "test",
                List.of(
                        new ApproversParam(ApprovalRole.APPROVER, 1, approver1),
                        new ApproversParam(ApprovalRole.APPROVER, 2, approver2)
                )
        );

        assertThat(draft.getApproval().getApprovers())
                .extracting(
                        Approver::getRole,
                        Approver::getOrder,
                        Approver::getEmp
                )
                .containsExactly(
                        tuple(ApprovalRole.APPROVER, 1, approver1),
                        tuple(ApprovalRole.APPROVER, 2, approver2)
                );
    }

    @Test
    @DisplayName("Approval이 이미 있으면 다시 생성할 수 없다")
    void createApproval_fail_when_already_exists() {
        GeneralDraft draft = GeneralDraft.createDraft(
                getApprovedEmp(),
                "test",
                "test",
                null
        );

        assertThatThrownBy(() ->
                draft.createDraftApproval(
                        List.of(new ApproversParam(
                                ApprovalRole.APPROVER,
                                1,
                                getApprovedEmp("20260410", "approver1")
                        ))
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Approval이 이미 있으면 상신 Approval 도 다시 생성할 수 없다")
    void createSubmittedApproval_fail_when_already_exists() {
        LocalDateTime submittedAt = LocalDateTime.of(2026, 6, 6, 0, 0, 0);

        GeneralDraft draft = GeneralDraft.createDraft(
                getApprovedEmp(),
                "test",
                "test",
                null
        );

        assertThatThrownBy(() ->
                draft.createSubmittedApproval(
                        List.of(new ApproversParam(
                                ApprovalRole.APPROVER,
                                1,
                                getApprovedEmp("20260410", "approver1")
                        )),
                        submittedAt
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("결재순서(order)가 양수가 아니면 결재선을 만들 수 없다.")
    void createApproval_fail_with_negative_order() {
        GeneralDraft draft = GeneralDraft.createDraft(
                getApprovedEmp(),
                "test",
                "test",
                null
        );

        assertThatThrownBy(() ->
                draft.createDraftApproval(
                        List.of(new ApproversParam(
                                ApprovalRole.APPROVER,
                                0,
                                getApprovedEmp("20260410", "approver1")
                        ))
                )
        ).isInstanceOf(IllegalStateException.class);
    }


    @Test
    @DisplayName("결재자가 approve 시, 결재 상태는 결재진행중(In_Progress)이고 해당 결재선의 승인정보가 갱신된다.")
    void approve_test() {
        GeneralDraft submitted = getSubmitted();

        Approver firstApprover = submitted.getApproval().getApprovers().getFirst();
        Emp firstApprover_emp = firstApprover.getEmp();
        LocalDateTime approvedAt = LocalDateTime.of(2026, 5, 1, 0,0,0);

        submitted.approve(firstApprover_emp, approvedAt);

        assertThat(submitted.getApproval().getStatus()).isEqualTo(ApprovalStatus.IN_PROGRESS);
        assertThat(firstApprover).extracting(
                Approver::getEmp, Approver::getApprovedAt
        ).containsExactly(
                firstApprover_emp, approvedAt
        );
    }

    @Test
    @DisplayName("결재자가 Reject 시, 결재 상태는 반려(Reject)가 되고 해당 결재선의 반려정보가 갱신된다.")
    void reject_test() {
        GeneralDraft submitted = getSubmitted();

        Approver firstApprover = submitted.getApproval().getApprovers().getFirst();
        Emp firstApprover_emp = firstApprover.getEmp();
        LocalDateTime rejectedAt = LocalDateTime.of(2026, 5, 1, 0,0,0);
        String reason = "reson";

        submitted.reject(firstApprover_emp, reason, rejectedAt);

        assertThat(submitted.getApproval().getStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(firstApprover).extracting(
                Approver::getEmp, Approver::getRejectedAt, Approver::getRejectReason
        ).containsExactly(
                firstApprover_emp,rejectedAt, reason
        );

    }

    @Test
    @DisplayName("결재 상태가 결재완료(approved)라면 approve는 실패한다.")
    void approve_fail_when_already_Approved() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        ReflectionTestUtils.setField(approval, "status", ApprovalStatus.APPROVED);

        Emp emp = approval.getApprovers().getFirst().getEmp();

        assertThatThrownBy(() ->
                submitted.approve(emp, LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("이미 완료된 결재건은 승인할 수 없음");
    }
    @Test
    @DisplayName("결재 상태가 결재완료(approved)라면 reject는 실패한다.")
    void reject_fail_when_already_Approved() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        ReflectionTestUtils.setField(approval, "status", ApprovalStatus.APPROVED);

        Emp emp = approval.getApprovers().getFirst().getEmp();

        assertThatThrownBy(() ->
                submitted.reject(emp, "test", LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("이미 완료된 결재건은 승인할 수 없음");
    }

    @Test
    @DisplayName("결재 상태가 반려(reject)라면 approve는 실패한다.")
    void approve_fail_when_already_rejected() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        ReflectionTestUtils.setField(approval, "status", ApprovalStatus.REJECTED);

        Emp emp = approval.getApprovers().getFirst().getEmp();

        assertThatThrownBy(() ->
                submitted.approve(emp, LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("반려된 결재건은 승인할 수 없음");
    }
    @Test
    @DisplayName("결재 상태가 반려(reject)라면 reject는 실패한다.")
    void reject_fail_when_already_rejected() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        ReflectionTestUtils.setField(approval, "status", ApprovalStatus.REJECTED);

        Emp emp = approval.getApprovers().getFirst().getEmp();

        assertThatThrownBy(() ->
                submitted.reject(emp, "test", LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("반려된 결재건은 승인할 수 없음");
    }

    @Test
    @DisplayName("현재 순번 결재자가 approve하고, 미결재가 남아있다면 결재상태는 IN_PROGRESS(결재진행중)이다.")
    void approve_when_in_order_approver_and_remain_unapproved() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        Approver approverInOrder = approval.getApprovers().stream()
                        .filter(Approver::isPending)
                        .min(Comparator.comparingInt(Approver::getOrder))
                        .orElseThrow();

        LocalDateTime approvedAt = LocalDateTime.of(2026, 5, 1, 0, 0, 0);
        submitted.approve(approverInOrder.getEmp(), approvedAt);

        assertThat(approverInOrder).extracting(
                Approver::getApproval, Approver::getRole, Approver::getOrder, Approver::getEmp, Approver::getApprovedAt
        ).containsExactly(
                approval, approverInOrder.getRole(), approverInOrder.getOrder(), approverInOrder.getEmp(), approvedAt
        );

        assertThat(approval.getStatus()).isEqualTo(ApprovalStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("현재 순번 결재자가 approve하고, 결재가 남아있지 않다면 결재상태는 APPROVED(결재완료)이다.")
    void approve_when_in_order_approver_and_not_remain_unapproved() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        LocalDateTime approvedAt = LocalDateTime.of(2026, 3, 3, 10, 0, 0);

        approval.getApprovers().forEach(a-> {
                approval.approve(a.getEmp(), approvedAt);
            }
        );

        assertThat(approval.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("결재자가 현재 결재 순번이 아니라면, approve는 실패한다.")
    void approve_fail_when_not_in_order_order_approver() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        Emp empNotInOrder = approval.getApprovers().getLast().getEmp();

        assertThatThrownBy(() ->
                submitted.approve(empNotInOrder, LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("현재 차례의 결재자가 아님");
    }
    @Test
    @DisplayName("결재자가 현재 결재 순번이 아니라면, reject는 실패한다.")
    void reject_fail_when_not_in_order_order_approver() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();

        Emp empNotInOrder = approval.getApprovers().getLast().getEmp();

        assertThatThrownBy(() ->
                submitted.reject(empNotInOrder, "test", LocalDateTime.of(2026, 5, 1, 0,0,0))
        ).isInstanceOf(IllegalStateException.class).hasMessage("현재 차례의 결재자가 아님");
    }

    @Test
    @DisplayName("결재대기 상태(WAITING)에서 상신을 회수(UNSUBMITTED)할 수 있다.")
    void revertToDraft_when_approve_status_waiting() {
        GeneralDraft submitted = getSubmitted();
        submitted.revertToDraft();

        assertThat(submitted.getApproval().getStatus()).isEqualTo(ApprovalStatus.UNSUBMITTED);
    }

    @Test
    @DisplayName("결재진행상태 이후 상신을 회수(UNSUBMITTED)할 수 없다.")
    void revertToDraft_when_approve_status_after_waiting() {
        GeneralDraft submitted = getSubmitted();
        Approver first = submitted.getApproval().getApprovers().getFirst();

        submitted.approve(first.getEmp(), LocalDateTime.of(2026, 4, 9, 0, 0, 0));

        assertThatThrownBy(submitted::revertToDraft).hasMessage("결재진행 이후 상신 취소 불가");
    }

    @Test
    @DisplayName("기안자는 문서의 결재상태 무관, 공람자를 설정할 수 있다.")
    void addCirculation_success() {
        GeneralDraft draft = getDraftWithApprovers();
        Emp sharedEmp = getApprovedEmp("202401001", "sharedEmp");
        
        draft.addCirculation(sharedEmp);
        
        assertThat(draft.getCirculations()).extracting(
                Circulation::getDraft, Circulation::getEmp, Circulation::getReadAt
        ).containsExactly(
                tuple(draft, sharedEmp, null)
        );
    }

    @Test
    @DisplayName("이미 공람된 사원은 공람자에 추가할 수 없다.")
    void addCirculation_when_already_circulated_fail() {
        GeneralDraft draft = getDraftWithApprovers();
        Emp sharedEmp = getApprovedEmp("202401001", "sharedEmp");

        draft.addCirculation(sharedEmp);

        assertThatThrownBy(() ->
            draft.addCirculation(sharedEmp)
        ).hasMessage("이미 공람된 사원");
    }

    @Test
    @DisplayName("이미 공람된 사원을 공람자에서 제외할 수 있다.")
    void removeCirculation() {
        GeneralDraft draft = getDraftWithApprovers();
        Emp sharedEmp = getApprovedEmp("202401001", "sharedEmp");
        draft.addCirculation(sharedEmp);

        draft.removeCirculation(sharedEmp);

        assertThat(draft.getCirculations()).isEmpty();
    }

    @Test
    @DisplayName("공람되지 않은 사원은 공람자에서 제외할 수 없다.")
    void removeCirculation_when_emp_not_in_circulation_fail() {
        GeneralDraft draft = getDraftWithApprovers();
        Emp sharedEmp = getApprovedEmp("202401001", "sharedEmp");

        assertThatThrownBy(() ->
                draft.removeCirculation(sharedEmp)
        ).hasMessage("해당 공람자가 없음");
    }

    @Test
    @DisplayName("공람 제외할 사원이 없으면 공람 제외할 수 없다.")
    void removeCirculation_when_emp_is_null_fail() {
        GeneralDraft draft = getDraftWithApprovers();

        assertThatThrownBy(() ->
                draft.removeCirculation(null)
        ).hasMessage("삭제할 공람자가 없음");
    }

    @Test
    @DisplayName("공람자 추가 시, 공람대상 사원 정보는 필수 값이다.")
    void addCirculation_without_emp_fail() {
        GeneralDraft draft = getDraftWithApprovers();

        assertThatThrownBy(() ->
                draft.addCirculation(null)
        ).hasMessage("공람자가 없음");
    }

    @Test
    @DisplayName("공람문서는 결재완료상태일때, 열람이 가능하다.")
    void readableByCirculation_when_approved() {
        GeneralDraft approvedDraft = getApprovedDraft();

        assertThat(approvedDraft.hasAllApproved()).isTrue();
    }

    @Test
    @DisplayName("공람자들이 문서를 열람할 때, 공람시각이 저장된다.")
    void readableByCirculation_when_not_remain_unapproved() {
        GeneralDraft approvedDraft = getApprovedDraft();
        Emp sharedEmp = getApprovedEmp("202401001", "sharedEmp");
        LocalDateTime readAt = LocalDateTime.of(2026, 5, 1, 0, 0, 0);

        approvedDraft.addCirculation(sharedEmp);
        approvedDraft.markReadByCirculation(sharedEmp, readAt);

        assertThat(approvedDraft.getCirculations()).extracting(
                Circulation::getDraft, Circulation::getEmp, Circulation::getReadAt
        ).containsExactly(
                tuple(approvedDraft, sharedEmp, readAt)
        );
    }

    @Test
    @DisplayName("미상신(UNSUBMITTED) 상태일 때는 approvers정보가 있어야 상신(SUBMIT)을 할 수 있다.")
    void submit_draft() {
        GeneralDraft draft = getDraftWithApprovers();
        LocalDateTime submittedAt = LocalDateTime.of(2026,5,5,0,0,0);

        Approval approval = draft.getApproval();
        draft.submit(submittedAt, null);

        assertThat(approval.getStatus()).isEqualTo(ApprovalStatus.WAITING);
    }

    @Test
    @DisplayName("approvers정보가 없으면 상신(SUBMIT)을 할 수 없다")
    void submit_draft_without_approvers() {
        GeneralDraft draft = getDraftWithoutApprovers();
        LocalDateTime submittedAt = LocalDateTime.of(2026,5,5,0,0,0);

        assertThatThrownBy(() ->
                draft.submit(submittedAt, null)
        ).hasMessage("결재자 정보가 없음");
    }

    @Test
    @DisplayName("상신(SUBMITTED) 상태일 때는 상신(SUBMIT)을 할 수 없다.")
    void submit_submitted_draft() {
        GeneralDraft draft = getApprovedDraft();
        LocalDateTime submittedAt = LocalDateTime.of(2026,5,5,0,0,0);

        assertThatThrownBy(() ->
                draft.submit(submittedAt, null)
        ).hasMessage("상신 가능한 상태가 아님");
    }

    @Test
    @DisplayName("기안 첨부파일을 추가할 수 있다.")
    void addFile() {
        GeneralDraft draft = getDraftWithApprovers();
        String mimeType = "image/png";
        String originalName = "originName";
        String extension = "png";
        Long fileSize = 1024L;

        draft.addFile(mimeType, originalName, extension, fileSize);

        assertThat(draft.getDraftFiles()).singleElement().extracting(
                DraftFile::getDraft, DraftFile::getMimeType, DraftFile::getOriginalName, DraftFile::getExtension, DraftFile::getFileSize
        ).containsExactly(
                draft, mimeType, originalName, extension, fileSize
        );
    }

    @Test
    @DisplayName("상신했을 경우 기안 첨부파일을 추가할 수 없다.")
    void addFile_for_submitted_fail() {
        GeneralDraft submitted = getSubmitted();
        String mimeType = "image/png";
        String originalName = "originName";
        String extension = "png";
        Long fileSize = 1024L;

        assertThatThrownBy(() ->
                submitted.addFile(mimeType, originalName, extension, fileSize)
        ).hasMessage("첨부파일수정가능 상태(UNSUBMITTED)가 아님");
    }

    @Test
    @DisplayName("기안정보가 없다면 기안 첨부파일을 추가할 수 없다.")
    void addFile_not_in_draft_fail() {
        GeneralDraft submitted = null;
        String mimeType = "image/png";
        String originalName = "originName";
        String extension = "png";
        Long fileSize = 1024L;

        assertThatThrownBy(() ->
                submitted.addFile(mimeType, originalName, extension, fileSize)
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("기안 첨부파일을 삭제할 수 있다.")
    void removeFile() {
        GeneralDraft draft = getDraftWithApprovers();
        draft.addFile("image/png", "originName", "png", 1024L);

        DraftFile first = draft.getDraftFiles().getFirst();
        ReflectionTestUtils.setField(first, "id", 1L);

        draft.removeFile(1);

        assertThat(draft.getDraftFiles()).isEmpty();
    }

    @Test
    @DisplayName("상신했을 경우 기안 첨부파일을 삭제할 수 없다.")
    void removeFile_for_submitted_fail() {
        GeneralDraft submitted = getDraftWithApprovers();
        submitted.addFile("image/png", "originName", "png", 1024L);
        submitted.approve(submitted.getApproval().getApprovers().getFirst().getEmp(),
                LocalDateTime.of(2026,5, 5,0,0,0));

        DraftFile first = submitted.getDraftFiles().getFirst();
        ReflectionTestUtils.setField(first, "id", 1L);

        assertThatThrownBy(() ->
                submitted.removeFile(1)
        ).hasMessage("첨부파일수정가능 상태(UNSUBMITTED)가 아님");
    }

    @Test
    @DisplayName("미상신 문서는 제목과 내용을 수정할 수 있다")
    void editDraft_success() {
        GeneralDraft draft = getDraftWithApprovers();
        String title = "edited";
        String content = "edited";

        draft.editGeneralDraft(title, content);

        assertThat(draft).extracting(
                GeneralDraft::getTitle, GeneralDraft::getContent
        ).containsExactly(
                title, content
        );
    }

    private static Stream<Arguments> editDraftFailArguments() {
        GeneralDraft draft = getDraftWithApprovers();
        GeneralDraft submitted = getSubmitted();
        String title = "edited";
        String content = "edited";

        return Stream.of(
                Arguments.of("미상신 문서만 수정가능",
                        EditParam.builder().draft(submitted).title(title).content(content).build()
                ),Arguments.of("제목은 빈값이 될 수 없음",
                        EditParam.builder().draft(draft).title(" ").build()
                ),Arguments.of("내용은 빈값이 될 수 없음",
                        EditParam.builder().draft(draft).content(" ").build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editDraftFailArguments")
    @DisplayName("기안서 수정 실패 케이스")
    void editDraftFailTest(String description, EditParam params) {
        assertThatThrownBy(() ->
                params.draft.editGeneralDraft(params.title, params.content)
        ).hasMessage(description);
    }

    @Builder
    private record EditParam(
            GeneralDraft draft,
            String title,
            String content
    ) {}

    @Test
    @DisplayName("반려 후 재상신시, 결재선을 다시 지정해야 한다.")
    void resubmit_with_approval_success() {
        GeneralDraft submitted = getSubmitted();

        Approver firstApprover = submitted.getApproval().getApprovers().getFirst();
        Emp firstApprover_emp = firstApprover.getEmp();
        LocalDateTime rejectedAt = LocalDateTime.of(2026, 5, 1, 0,0,0);
        String reason = "reson";

        submitted.reject(firstApprover_emp, reason, rejectedAt);

        submitted.submit(LocalDateTime.of(2026,5, 5,0,0,0)
                , List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmpWithoutDept("20260410", "approver1")))
        );

        assertThat(submitted.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);
    }

    @Test
    @DisplayName("반려 후 재상신시, 결재선을 다시 지정하지 않으면 실패한다.")
    void resubmit_without_approval_fail() {
        GeneralDraft submitted = getSubmitted();

        Approver firstApprover = submitted.getApproval().getApprovers().getFirst();
        Emp firstApproverEmp = firstApprover.getEmp();

        LocalDateTime rejectedAt = LocalDateTime.of(2026, 5, 1, 0, 0, 0);
        String reason = "reason";

        submitted.reject(firstApproverEmp, reason, rejectedAt);

        LocalDateTime resubmittedAt = LocalDateTime.of(2026, 5, 5, 0, 0, 0);

        assertThatThrownBy(() ->
                submitted.submit(resubmittedAt, List.of())
        ).isInstanceOf(IllegalStateException.class);
    }

    private static GeneralDraft getSubmitted() {

        return GeneralDraft.createSubmitted(
                getApprovedEmp(),
                "test",
                "test",
                List.of(new ApproversParam(
                        ApprovalRole.APPROVER,
                        1,
                        getApprovedEmp("20260410", "approver1")),
                        new ApproversParam(
                                ApprovalRole.APPROVER,
                                2,
                                getApprovedEmp("20260411", "approver2"))
                ),
                LocalDateTime.of(2026, 6, 6, 0, 0, 0)
        );
    }

    private static GeneralDraft getDraftWithApprovers() {

        return GeneralDraft.createDraft(
                getApprovedEmp(),
                "test",
                "test",
                List.of(new ApproversParam(
                                ApprovalRole.APPROVER,
                                1,
                                getApprovedEmp("20260410", "approver1")),
                        new ApproversParam(
                                ApprovalRole.APPROVER,
                                2,
                                getApprovedEmp("20260411", "approver2"))
                )
        );
    }

    private GeneralDraft getDraftWithoutApprovers() {
        return GeneralDraft.createDraft(
                getApprovedEmp(),
                "test",
                "test",
                null
        );
    }

    private GeneralDraft getDraftWithApprovers(String title, String content, Emp drafter, List<ApproversParam> approverParam) {

        return GeneralDraft.createDraft(
                drafter, title, content, approverParam
        );
    }

    private GeneralDraft getSubmitted(String title, String content, Emp drafter, List<ApproversParam> approverParam) {

        return GeneralDraft.createSubmitted(
                drafter, title, content, approverParam,
                LocalDateTime.of(2026, 6, 6, 0, 0, 0)
        );
    }

    private GeneralDraft getApprovedDraft() {
        GeneralDraft submitted = getSubmitted();
        Approval approval = submitted.getApproval();
        List<Approver> approvers = approval.getApprovers();
        LocalDateTime signedAt = LocalDateTime.of(2026, 5, 1, 0,0,0);

        approvers.forEach( a -> {
            submitted.approve(a.getEmp(), signedAt);
        });

        return submitted;
    }
}