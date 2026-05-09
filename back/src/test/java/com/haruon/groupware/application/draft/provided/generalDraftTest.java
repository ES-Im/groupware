package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftUpdateRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

@TestIntegrationConfig
public record generalDraftTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        GeneralDraftManagement generalDraftManagement,
        EmpRepository empRepository,
        BusinessTripDraftManagement businessTripDraftManagement,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        draftRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("일반 기안서 테스트 - 상신 전 제목과 내용을 수정할 수 있다.")
    void update_draft_before_submitted_success() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");
        String editedTitle = "edited_test";
        String editedContent = "edited_test";

        Draft draft = createDraft(drafter, "test", "test", List.of());
        generalDraftManagement.updateDraft(
                CommonDraftUpdateRequest.builder()
                        .drafterId(drafter.getId())
                        .draftId(draft.getId())
                        .title(editedTitle)
                        .content(editedContent)
                        .build()
        );

        Draft foundDraft = draftRepository.findById(draft.getId()).orElseThrow();

        assertEquals(editedTitle, foundDraft.getTitle());
        assertEquals(editedContent, foundDraft.getContent());
    }

    @Test
    @DisplayName("일반기안서 테스트 - 수정할 내용이 없으면, 업데이트가 실패한다.")
    void update_draft_without_editable_instance_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");

        Draft draft = createDraft(drafter, "test", "test", List.of());
        assertThatThrownBy(() ->
                generalDraftManagement.updateDraft(
                        CommonDraftUpdateRequest.builder()
                                .drafterId(drafter.getId())
                                .draftId(draft.getId())
                                .build()
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("일반기안서 테스트 - 수정할 내용이 없으면, 업데이트가 실패한다.")
    void update_draft_after_submitted_fail() {
        Emp drafter = saveApprovedEmp(empRepository, "202601001", "drafter");

        Draft draft = createSubmitted(
                drafter,
                "test",
                "test",
                List.of(saveApprovedEmp(empRepository, "202601002", "approver")),
                LocalDateTime.of(2026, 1, 1, 0, 0, 0)
        );

        assertThatThrownBy(() ->
                generalDraftManagement.updateDraft(
                        CommonDraftUpdateRequest.builder()
                                .drafterId(drafter.getId())
                                .draftId(draft.getId())
                                .title("edit")
                                .content("edit")
                                .build()
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("일반기안서 테스트 - 다른 기안서타입이라면, 일반 기안서 업데이트가 실패한다.")
    void update_draft_other_type_draft_fail() {
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
                generalDraftManagement.updateDraft(
                        CommonDraftUpdateRequest.builder()
                                .drafterId(drafter.getId())
                                .draftId(draft.getId())
                                .title("edit")
                                .content("edit")
                                .build()
                )
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
}
