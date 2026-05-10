package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.DraftFileCreateRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.ApprovalLineRequiredException;
import com.haruon.groupware.application.exception.draft.DraftNotFoundException;
import com.haruon.groupware.application.utils.FileDto;
import com.haruon.groupware.domain.draft.Approver;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.DraftFile;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.draft.sub.ApprovalStatus.UNSUBMITTED;
import static com.haruon.groupware.domain.draft.sub.ApprovalStatus.WAITING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record CommonDraftTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        GeneralDraftManagement generalDraftManagement,
        EmpRepository empRepository,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        draftRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();

    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 임시 저장 시, 결재선, 상신일시를 비우고 저장할 수 있다.")
    void createDraft_without_approval_info_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        String title = "test";
        String content = "test";

        Draft draft = createDraft(drafter, title, content, List.of());

        assertThat(draft).extracting(
                Draft::getEmp, Draft::getTitle, Draft::getContent, Draft::getSubmittedAt
        ).containsExactly(
                drafter, title, content, null
        );

        assertThat(draft.getApproval().getStatus()).isEqualTo(UNSUBMITTED);
        assertThat(draft.getDraftFiles()).isEmpty();
        assertThat(draft.getCirculations()).isEmpty();
        assertThat(draft.getSourceKey()).isNotNull();

    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 결재선과 상신일시를 입력시, 이미 임시저장된 기안서를 상신할 수 있다.")
    void submit_Draft_success() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        String title = "test";
        String content = "test";

        Draft draft = createDraft(drafter, title, content, List.of());
        generalDraftManagement.submit(draft.getId(), drafter.getId(), LocalDateTime.of(2026, 1, 1, 0, 0, 0)
                , List.of(new ApproversRequest(approverEmp1.getId(), ApprovalRole.APPROVER, 1)));

        assertThat(draft.getApproval().getStatus()).isEqualTo(WAITING);
    }
    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 결재선과 상신일시를 입력하지않으면, 이미 임시저장된 기안서를 상신할 수 없다.")
    void submit_Draft_fail() {
        Emp drafter = saveApprovedEmp(empRepository);
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        String title = "test";
        String content = "test";

        Draft draft = createDraft(drafter, title, content, List.of());

        assertThatThrownBy(() ->
                generalDraftManagement.submit(
                        draft.getId(),
                        drafter.getId(),
                        LocalDateTime.of(2026, 1, 1, 0, 0, 0),
                        List.of()
                )
        ).isInstanceOf(ApprovalLineRequiredException.class);

        assertThatThrownBy(() ->
                generalDraftManagement.submit(
                        draft.getId(),
                        drafter.getId(),
                        null,
                        List.of(new ApproversRequest(approverEmp1.getId(), ApprovalRole.APPROVER, 1))
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 임시 저장 시, 결재선, 상신일시를 같이 저장할 수 있다.")
    void createDraft_with_approval_info_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        String title = "test";
        String content = "test";

        Draft draft = createDraft(drafter, title, content, List.of(approverEmp1, approverEmp2));

        assertThat(draft).extracting(
                Draft::getEmp, Draft::getTitle, Draft::getContent, Draft::getSubmittedAt
        ).containsExactly(
                drafter, title, content, null
        );

        assertThat(draft.getApproval().getStatus()).isEqualTo(UNSUBMITTED);

        List<Emp> list = draft.getApproval()
                .getApprovers().stream()
                .map(Approver::getEmp)
                .toList();
        assertThat(list.size()).isEqualTo(2);
        assertThat(list).containsExactlyInAnyOrder(approverEmp1, approverEmp2);

        assertThat(draft.getDraftFiles()).isEmpty();
        assertThat(draft.getCirculations()).isEmpty();
        assertThat(draft.getSourceKey()).isNotNull();
    }


    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 상신 시, 결재선, 상신일시를 같이 기재해야한다.")
    void createSubmitted_with_approval_info_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        String title = "test";
        String content = "test";

        LocalDateTime submittedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);

        Draft draft = createSubmitted(drafter, title, content, List.of(approverEmp1, approverEmp2), submittedAt);

        assertThat(draft.getSubmittedAt()).isEqualTo(submittedAt);
        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);

        List<Emp> list = draft.getApproval()
                .getApprovers().stream()
                .map(Approver::getEmp)
                .toList();
        assertThat(list.size()).isEqualTo(2);
        assertThat(list).containsExactlyInAnyOrder(approverEmp1, approverEmp2);
    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 상신 시, 결재선, 상신일시를 같이 기재하지 않으면 실패한다.")
    void createSubmitted_without_approval_info_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        String title = "test";
        String content = "test";

        LocalDateTime submittedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);

        assertThatThrownBy(() ->
                createSubmitted(drafter, title, content, List.of(), submittedAt)
        ).isInstanceOf(ApprovalLineRequiredException.class);

        assertThatThrownBy(() ->
                createSubmitted(drafter, title, content, List.of(approverEmp1, approverEmp2), null)
        ).isInstanceOf(RequiredValueMissingException.class);

    }

    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재 대기 상태라면 상신을 취소할 수 있다.")
    void reverToDraft_when_approval_status_is_waiting() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Draft draft = getSubmitted(drafter);
        generalDraftManagement.revertToDraft(draft.getId(), drafter.getId());

        Draft foundDraft = draftRepository.findById(draft.getId()).orElseThrow();

        assertThat(foundDraft.getApproval().getStatus()).isEqualTo(UNSUBMITTED);
    }

    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 기안자가 아닌 사원이 상신을 취소할 수 없다.")
    void reverToDraft_by_not_drafter_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp notDrafter = saveApprovedEmp(empRepository, "202601002", "notDrafter");
        Draft draft = getSubmitted(drafter);
        assertThatThrownBy(() ->
                generalDraftManagement.revertToDraft(draft.getId(), notDrafter.getId())
        ).isInstanceOf(DraftNotFoundException.class);
    }

    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재 대기 상태가 아니라면 상신을 취소할 수 없다.")
    void reverToDraft_after_approve_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmitted(drafter, "test", "test", List.of(approverEmp1, approverEmp2), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        generalDraftManagement.approve(draft.getId(), approverEmp1.getId(), LocalDateTime.of(2026, 1, 1, 0, 0, 5));

        assertThatThrownBy(() ->
                    generalDraftManagement.revertToDraft(draft.getId(), drafter.getId())
        ).isInstanceOf(IllegalStateException.class);
    }

    @Transactional
    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재선 순서에 따라 결재자가 기안을 결재할 수 있다.")
    void approve_draft_by_order_approver() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmitted(drafter, "test", "test", List.of(approverEmp1, approverEmp2), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        Approver firstApprover = draft.getApproval().getApprovers().stream()
                .filter(approver -> approver.getOrder() == 1)
                .findFirst().orElseThrow();

        generalDraftManagement.approve(
                draft.getId(), firstApprover.getEmp().getId(), LocalDateTime.of(2026, 1, 1, 0, 0, 5)
        );

        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.IN_PROGRESS);

        Approver secondApprover = draft.getApproval().getApprovers().stream()
                .filter(approver -> approver.getOrder() == 2)
                .findFirst().orElseThrow();

        assertThat(secondApprover.getApprovedAt()).isNull();
    }

    @Transactional
    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재선 순서에 따라 결재하지 않으면 결재할 수 없다.")
    void approve_draft_by_not_order_approver() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmitted(drafter, "test", "test", List.of(approverEmp1, approverEmp2), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        Approver secondApprover = draft.getApproval().getApprovers().stream()
                .filter(approver -> approver.getOrder() == 2)
                .findFirst().orElseThrow();

        assertThatThrownBy(() ->
                generalDraftManagement.approve(
                        draft.getId(), secondApprover.getEmp().getId(), LocalDateTime.of(2026, 1, 1, 0, 0, 5)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Transactional
    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재선 순서에 따라 결재자가 기안을 반려할 수 있다.")
    void reject_draft_by_order_approver() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmitted(drafter, "test", "test", List.of(approverEmp1, approverEmp2), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        Approver firstApprover = draft.getApproval().getApprovers().stream()
                .filter(approver -> approver.getOrder() == 1)
                .findFirst().orElseThrow();

        generalDraftManagement.reject(
                draft.getId(), firstApprover.getEmp().getId(), "test", LocalDateTime.of(2026, 1, 1, 0, 0, 5)
        );

        assertThat(draft.getApproval().getStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(firstApprover.getRejectedAt()).isNotNull();
        assertThat(firstApprover.getRejectReason()).isNotNull();
    }

    @Transactional
    @Test
    @DisplayName("전자결재 공통 사항 테스트 - 결재선 순서에 따라 결재하지 않으면 반려할 수 없다.")
    void reject_draft_by_not_order_approver() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        Draft draft = createSubmitted(drafter, "test", "test", List.of(approverEmp1, approverEmp2), LocalDateTime.of(2026, 1, 1, 0, 0, 0));

        Approver secondApprover = draft.getApproval().getApprovers().stream()
                .filter(approver -> approver.getOrder() == 2)
                .findFirst().orElseThrow();

        assertThatThrownBy(() ->
                generalDraftManagement.reject(
                        draft.getId(), secondApprover.getEmp().getId(), "test", LocalDateTime.of(2026, 1, 1, 0, 0, 5)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Transactional
    @TestFactory
    @DisplayName("전자결재 공통 사항 테스트 - 공람은 결재 상태와 무관하게 언제든 지정할 수 있다.")
    Collection<DynamicTest> circuit_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        String title = "test";
        String content = "test";
        Draft draft = createDraft(drafter, title, content, List.of(approverEmp1, approverEmp2));
        Emp firstShareEmp
                = saveApprovedEmp(empRepository, "202601004", "sharedEmp");
        return List.of(
                DynamicTest.dynamicTest("미상신 상태에서 공람 지정", () -> {
                    generalDraftManagement.addCirculatedEmp(draft.getId(), drafter.getId(), firstShareEmp.getId());

                    assertThat(draft.getCirculations()).hasSize(1);
                }), DynamicTest.dynamicTest("상신 후 결재 대기 상태에서 공람 지정", () -> {
                    LocalDateTime submittedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601005", "sharedEmp2");
                    draft.submit(submittedAt, List.of());

                    generalDraftManagement.addCirculatedEmp(draft.getId(), drafter.getId(), sharedEmp.getId());

                    assertThat(draft.getCirculations()).hasSize(2);
                }), DynamicTest.dynamicTest("결재 진행 중에서 공람 지정", () -> {
                    draft.approve(approverEmp1, LocalDateTime.of(2026, 1, 2, 0, 0, 0));

                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601006", "sharedEmp3");
                    generalDraftManagement.addCirculatedEmp(draft.getId(), drafter.getId(), sharedEmp.getId());

                    assertThat(draft.getCirculations()).hasSize(3);
                }), DynamicTest.dynamicTest("결재 완료 상태에서 공람 지정", () -> {
                    draft.approve(approverEmp2, LocalDateTime.of(2026,1,2,1,1,1));

                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601007", "sharedEmp4");
                    generalDraftManagement.addCirculatedEmp(draft.getId(), drafter.getId(), sharedEmp.getId());

                    assertThat(draft.getCirculations()).hasSize(4);
                }), DynamicTest.dynamicTest("지정된 공람자를 삭제 할 수 있다.", () -> {
                    generalDraftManagement.removeCirculatedEmp(draft.getId(), drafter.getId(), firstShareEmp.getId());

                    assertThat(draft.getCirculations()).hasSize(3);
                })
        );
    }
    
    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 파일 첨부는 상신전에 할 수 있다.")
    void add_file_when_unsubmitted_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Draft draft = createDraft(drafter, "test", "test", List.of());

        String originalFileName = "test.pdf";
        DraftFileCreateRequest fileRequest = DraftFileCreateRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName(originalFileName)
                        .fileSize(5 * 1024 * 1024L)
                        .build())
                .build();

        generalDraftManagement.addFile(draft.getId(), drafter.getId(), fileRequest);

        assertThat(draft.getDraftFiles()).hasSize(1);
        assertThat(draft.getDraftFiles()).singleElement().extracting(
                DraftFile::getFileSize, DraftFile::getExtension, DraftFile::getOriginalName
        ).containsExactly(
                5 * 1024 * 1024L, "pdf", originalFileName.substring(0, originalFileName.lastIndexOf('.'))
        );
    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 상신 전 첨부된 파일을 삭제할 수 있다.")
    void remove_file_when_unsubmitted_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Draft draft = createDraft(drafter, "test", "test", List.of());

        String originalFileName = "test.pdf";
        DraftFileCreateRequest fileRequest = DraftFileCreateRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName(originalFileName)
                        .fileSize(5 * 1024 * 1024L)
                        .build())
                .build();

        generalDraftManagement.addFile(draft.getId(), drafter.getId(), fileRequest);

        entityManager.flush();
        entityManager.clear();

        Draft result = draftRepository.findById(draft.getId()).orElseThrow();
        generalDraftManagement.removeFile(result.getId(), drafter.getId(), draft.getDraftFiles().getFirst().getId());

        assertThat(result.getDraftFiles()).hasSize(0);
    }

    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 기안서 파일 첨부는 상신 후에는 할 수 없다.")
    void add_file_when_submitted_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Draft draft = createSubmitted(
                drafter,
                "test",
                "test",
                List.of(saveApprovedEmp(empRepository, "202601002", "approver")),
                LocalDateTime.of(2026, 1, 1, 0, 0, 0)
        );

        DraftFileCreateRequest file = DraftFileCreateRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(5 * 1024 * 1024L)
                        .build())
                .build();

        assertThatThrownBy(() ->
                generalDraftManagement.addFile(
                        draft.getId(), drafter.getId(), file
                )

        ).isInstanceOf(IllegalStateException.class);
    }


    @Test
    @Transactional
    @DisplayName("전자결재 공통 사항 테스트 - 상신 후 첨부된 파일을 삭제할 수 있다.")
    void remove_file_when_submitted_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approver = saveApprovedEmp(empRepository, "202601002", "approver");
        Draft draft = createDraft(drafter, "test", "test", List.of(approver));

        String originalFileName = "test.pdf";
        DraftFileCreateRequest fileRequest = DraftFileCreateRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName(originalFileName)
                        .fileSize(5 * 1024 * 1024L)
                        .build())
                .build();

        generalDraftManagement.addFile(draft.getId(), drafter.getId(), fileRequest);
        generalDraftManagement.submit(draft.getId(), drafter.getId(), LocalDateTime.of(2026,4,1,0,0,0), List.of());

        assertThatThrownBy(() ->
                generalDraftManagement.removeFile(draft.getId(), drafter.getId(), draft.getDraftFiles().get(0).getId())
        ).isInstanceOf(IllegalStateException.class);
    }

    private Draft createDraft(
            Emp drafter,
            String title,
            String content,
            List<Emp> approvers) {

        List<ApproversRequest> approversRequests = new ArrayList<>();
        int order = 1;
        for (Emp approver : approvers) {
            approversRequests.add(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, order++));
        }

        generalDraftManagement.createDraft(
                CommonDraftCreateRequest.builder()
                        .empId(drafter.getId())
                        .title(title)
                        .content(content)
                        .approvers(approversRequests)
                        .build()
        );

        return draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
    }

    private Draft createSubmitted(
            Emp drafter,
            String title,
            String content,
            List<Emp> approvers,
            LocalDateTime submittedAt) {

        List<ApproversRequest> approversRequests = new ArrayList<>();
        int order = 1;
        for (Emp approver : approvers) {
            approversRequests.add(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, order++));
        }

        generalDraftManagement.createSubmitted(
                CommonDraftCreateRequest.builder()
                        .empId(drafter.getId())
                        .title(title)
                        .content(content)
                        .approvers(approversRequests)
                        .submittedAt(submittedAt)
                        .build()
        );

        return draftRepository.findByEmp(drafter).stream().findFirst().orElseThrow();
    }


    private Draft getSubmitted(Emp drafter) {
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");
        LocalDateTime submittedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
        String title = "test";
        String content = "test";

        return createSubmitted(drafter, title, content, List.of(approverEmp1, approverEmp2), submittedAt);
    }

}