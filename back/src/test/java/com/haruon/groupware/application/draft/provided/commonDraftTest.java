package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.empInfo.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft.Approver;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.saveApprovedEmp;
import static com.haruon.groupware.domain.draft.sub.ApprovalStatus.UNSUBMITTED;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
record commonDraftTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        GeneralDraftManagement generalDraftManagement,
        EmpRepository empRepository
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
    @DisplayName("결재 대기 상태라면 상신을 취소할 수 있다.")
    void reverToDraft_when_approval_status_is_waiting() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");

        Draft draft = getSubmitted(drafter);

        generalDraftManagement.revertToDraft(draft.getId(), drafter.getId());



    }


    @Transactional
    @TestFactory
    @DisplayName("공람은 결재 상태와 무관하게 언제든 지정할 수 있다.")
    Collection<DynamicTest> circuit_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        Emp approverEmp1 = saveApprovedEmp(empRepository, "202601002", "approver1");
        Emp approverEmp2 = saveApprovedEmp(empRepository, "202601003", "approver2");

        String title = "test";
        String content = "test";
        Draft draft = createDraft(drafter, title, content, List.of(approverEmp1, approverEmp2));

        return List.of(
                DynamicTest.dynamicTest("미상신 상태에서 공람 지정", () -> {
                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601004", "sharedEmp");
                    draft.addCirculation(sharedEmp);

                    assertThat(draft.getCirculations()).hasSize(1);
                }), DynamicTest.dynamicTest("상신 후 결재 대기 상태에서 공람 지정", () -> {
                    LocalDateTime submittedAt = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601005", "sharedEmp2");
                    draft.submit(submittedAt, List.of());

                    draft.addCirculation(sharedEmp);

                    assertThat(draft.getCirculations()).hasSize(2);
                }), DynamicTest.dynamicTest("결재 진행 중에서 공람 지정", () -> {
                    draft.approve(approverEmp1, LocalDateTime.of(2026, 1, 2, 0, 0, 0));

                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601006", "sharedEmp3");
                    draft.addCirculation(sharedEmp);

                    assertThat(draft.getCirculations()).hasSize(3);
                }), DynamicTest.dynamicTest("결재 완료 상태에서 공람 지정", () -> {
                    draft.approve(approverEmp2, LocalDateTime.of(2026,1,2,1,1,1));

                    Emp sharedEmp = saveApprovedEmp(empRepository, "202601007", "sharedEmp4");
                    draft.addCirculation(sharedEmp);

                    assertThat(draft.getCirculations()).hasSize(4);
                })
        );
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

        return draftRepository.findByEmp(drafter).orElseThrow();
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

        return draftRepository.findByEmp(drafter).orElseThrow();
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