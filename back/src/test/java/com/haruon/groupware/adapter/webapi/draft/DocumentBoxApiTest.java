package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.domain.draft.GeneralDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveEmpWithDept;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class DocumentBoxApiTest extends IntegrationTestSupport {

    @Autowired
    private DraftRepository draftRepository;

    @AfterEach
    void tearDownDrafts() {
        draftRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("내 상신 기안서 목록 조회 - 상신된 내 문서만 조회한다")
    void mySubmittedDrafts_success() throws Exception {
        String password = "!Q2w3e4r5t";
        String loginId = "employee12345";
        registerEmpHavingAllInfo(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        GeneralDraft matched = saveSubmittedDraftWithFile(
                emp,
                "제출 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 1, 9, 0)
        );
        saveUnsubmittedDraft(emp, "제출 제외 문서", List.of(approver));

        String otherLoginId = "employee12346";
        activatedEmp(otherLoginId, password);
        Emp otherEmp = empRepository.findByLoginId(otherLoginId).orElseThrow();
        saveSubmittedDraft(
                otherEmp,
                "제출 다른 사람 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 2, 9, 0)
        );

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/document-box/me/submitted-drafts")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "제출")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].draftId").value(matched.getId()))
                .andExpect(jsonPath("$.content[0].draftTitle").value("제출 문서"))
                .andExpect(jsonPath("$.content[0].isFileAttached").value(true))
                .andExpect(jsonPath("$.content[0].approvalStatus").value("결재대기"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("내 임시저장 기안서 목록 조회 - 미상신 문서만 조회한다")
    void myUnsubmittedDrafts_success() throws Exception {
        String password = "!Q2w3e4r5t";
        String loginId = "employee12345";
        registerEmpHavingAllInfo(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        GeneralDraft matched = saveUnsubmittedDraft(emp, "임시 문서", List.of(approver));
        saveSubmittedDraft(
                emp,
                "임시 제출 제외 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 1, 9, 0)
        );

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/document-box/me/unsubmitted-drafts")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "임시")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].draftId").value(matched.getId()))
                .andExpect(jsonPath("$.content[0].draftTitle").value("임시 문서"))
                .andExpect(jsonPath("$.content[0].isFileAttached").value(false))
                .andExpect(jsonPath("$.content[0].approvalStatus").value("미상신"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("내 결재 대기 기안서 목록 조회 - 현재 내 결재 순번인 문서만 조회한다")
    void pendingMyApprovalDrafts_success() throws Exception {
        String password = "!Q2w3e4r5t";
        String loginId = "employee12345";
        registerEmpHavingAllInfo(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String firstApproverLoginId = "approver12345";
        activatedEmp(firstApproverLoginId, password);
        Emp firstApprover = empRepository.findByLoginId(firstApproverLoginId).orElseThrow();
        firstApprover.changeInfoByHR("First", null, null, null, null, null);
        empRepository.save(firstApprover);

        String drafterLoginId = "employee12346";
        activatedEmp(drafterLoginId, password);
        Emp drafter = empRepository.findByLoginId(drafterLoginId).orElseThrow();

        GeneralDraft matched = saveSubmittedDraft(
                drafter,
                "결재 문서",
                List.of(firstApprover, emp),
                LocalDateTime.of(2026, 4, 1, 9, 0)
        );
        matched.approve(firstApprover, LocalDateTime.of(2026, 4, 1, 10, 0));
        draftRepository.save(matched);

        saveSubmittedDraft(
                drafter,
                "결재 순번 제외 문서",
                List.of(firstApprover, emp),
                LocalDateTime.of(2026, 4, 2, 9, 0)
        );

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/document-box/me/pending-approval-drafts")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "결재")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].draftId").value(matched.getId()))
                .andExpect(jsonPath("$.content[0].draftTitle").value("결재 문서"))
                .andExpect(jsonPath("$.content[0].latestApproverName").value("First"))
                .andExpect(jsonPath("$.content[0].approvalStatus").value("결재진행중"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("내 조회 가능 문서 목록 조회 - 결재완료된 부서/공람/결재자 문서를 조회한다")
    void myAccessibleDocuments_success() throws Exception {
        String password = "!Q2w3e4r5t";
        String loginId = "employee12345";
        registerEmpHavingAllInfo(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        Dept it = getDept("002", "IT");
        Dept fin = getDept("003", "FIN");
        Emp sameDeptDrafter = saveEmpWithDept(empRepository, deptRepository, "202604001", "sameDeptDrafter", it);
        Emp otherDeptDrafter = saveEmpWithDept(empRepository, deptRepository, "202604002", "otherDeptDrafter", fin);

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        GeneralDraft sameDeptDraft = saveApprovedDraft(
                sameDeptDrafter,
                "열람 부서 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 1, 9, 0)
        );
        GeneralDraft circulatedDraft = saveApprovedDraft(
                otherDeptDrafter,
                "열람 공람 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 2, 9, 0)
        );
        circulatedDraft.addCirculation(emp);
        draftRepository.save(circulatedDraft);

        GeneralDraft approverDraft = saveApprovedDraft(
                otherDeptDrafter,
                "열람 결재자 문서",
                List.of(emp),
                LocalDateTime.of(2026, 4, 3, 9, 0)
        );
        saveSubmittedDraft(
                otherDeptDrafter,
                "열람 미완료 제외 문서",
                List.of(approver),
                LocalDateTime.of(2026, 4, 4, 9, 0)
        );

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/document-box/me/accessible-documents")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "열람")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].draftId").value(approverDraft.getId()))
                .andExpect(jsonPath("$.content[1].draftId").value(circulatedDraft.getId()))
                .andExpect(jsonPath("$.content[2].draftId").value(sameDeptDraft.getId()))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    private GeneralDraft saveUnsubmittedDraft(Emp drafter, String title, List<Emp> approvers) {
        GeneralDraft draft = GeneralDraft.createDraft(
                drafter,
                title,
                title + " 내용",
                approverParams(approvers)
        );

        draftRepository.save(draft);
        return draft;
    }

    private GeneralDraft saveSubmittedDraft(
            Emp drafter,
            String title,
            List<Emp> approvers,
            LocalDateTime submittedAt
    ) {
        GeneralDraft draft = GeneralDraft.createSubmitted(
                drafter,
                title,
                title + " 내용",
                approverParams(approvers),
                submittedAt
        );

        draftRepository.save(draft);
        return draft;
    }

    private GeneralDraft saveSubmittedDraftWithFile(
            Emp drafter,
            String title,
            List<Emp> approvers,
            LocalDateTime submittedAt
    ) {
        GeneralDraft draft = GeneralDraft.createDraft(
                drafter,
                title,
                title + " 내용",
                approverParams(approvers)
        );
        draft.addFile(
                "text/plain",
                title + ".txt",
                title + "-stored.txt",
                "txt",
                100L,
                "/test/drafts"
        );
        draft.submit(submittedAt, null);

        draftRepository.save(draft);
        return draft;
    }

    private GeneralDraft saveApprovedDraft(
            Emp drafter,
            String title,
            List<Emp> approvers,
            LocalDateTime submittedAt
    ) {
        GeneralDraft draft = saveSubmittedDraft(drafter, title, approvers, submittedAt);
        for (int i = 0; i < approvers.size(); i++) {
            draft.approve(approvers.get(i), submittedAt.plusHours(i + 1));
        }
        draftRepository.save(draft);
        return draft;
    }

    private List<ApproversParam> approverParams(List<Emp> approvers) {
        return approvers.stream()
                .map(approver -> new ApproversParam(ApprovalRole.APPROVER, approvers.indexOf(approver) + 1, approver))
                .toList();
    }
}
