package com.haruon.groupware.adapter.webapi.draft.businessTrip;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.domain.draft.BusinessTripCancelDraft;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
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

public class BusinessTripApiTest extends IntegrationTestSupport {

    @Autowired
    private DraftRepository draftRepository;

    @AfterEach
    void tearDownDrafts() {
        draftRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("부서 출장 신청 이력 조회 - 부서 매니저는 같은 부서원의 신청 이력을 조회한다")
    void deptBusinessTripRequestHistories_success() throws Exception {
        String password = "!Q2w3e4r5t";
        Dept dept = getDept("002", "IT");

        String managerLoginId = "manager12345";
        registerDeptManager(managerLoginId, password, dept);
        String managerAccessToken = loginByIdAndPw(managerLoginId, password);

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "targetEmp", dept);
        Emp otherEmp = saveEmpWithDept(empRepository, deptRepository, "202601002", "otherEmp", getDept("003", "FIN"));

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        BusinessTripDraft matched = saveSubmittedBusinessTripDraft(
                targetEmp,
                approver,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 12, 18, 0),
                "서울",
                "고객 미팅"
        );
        saveSubmittedBusinessTripDraft(
                otherEmp,
                approver,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 12, 18, 0),
                "부산",
                "지점 점검"
        );

        mockMvc.perform(
                        get("/api/businessTrip/departments/{deptId}/request-history", dept.getId())
                                .header("Authorization", BEARER + managerAccessToken)
                                .param("keyword", "Test")
                                .param("approvalStatus", ApprovalStatus.WAITING.name())
                                .param("yearMonth", "2026-04")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].empId").value(targetEmp.getId()))
                .andExpect(jsonPath("$.content[0].empName").value("Test"))
                .andExpect(jsonPath("$.content[0].historyResponse.draftId").value(matched.getId()))
                .andExpect(jsonPath("$.content[0].historyResponse.destination").value("서울"))
                .andExpect(jsonPath("$.content[0].historyResponse.purpose").value("고객 미팅"))
                .andExpect(jsonPath("$.content[0].historyResponse.approvalStatus").value("결재대기"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("내 출장 신청 이력 조회 - 상태와 월 조건으로 본인 신청 이력만 조회한다")
    void myBusinessTripRequestHistories_success() throws Exception {
        String password = "!Q2w3e4r5t";
        String loginId = "employee12345";
        activatedEmp(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String otherLoginId = "employee12346";
        activatedEmp(otherLoginId, password);
        Emp otherEmp = empRepository.findByLoginId(otherLoginId).orElseThrow();

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        BusinessTripDraft matched = saveSubmittedBusinessTripDraft(
                emp,
                approver,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 12, 18, 0),
                "서울",
                "고객 미팅"
        );
        BusinessTripDraft cancelled = saveSubmittedBusinessTripDraft(
                emp,
                approver,
                LocalDateTime.of(2026, 4, 20, 9, 0),
                LocalDateTime.of(2026, 4, 21, 18, 0),
                "제주",
                "워크숍"
        );
        saveSubmittedBusinessTripCancelDraft(emp, approver, cancelled.getSourceKey());
        saveSubmittedBusinessTripDraft(
                emp,
                approver,
                LocalDateTime.of(2026, 5, 10, 9, 0),
                LocalDateTime.of(2026, 5, 12, 18, 0),
                "대전",
                "교육"
        );
        saveSubmittedBusinessTripDraft(
                otherEmp,
                approver,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 12, 18, 0),
                "부산",
                "지점 점검"
        );

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/businessTrip/employees/me/request-history")
                                .header("Authorization", BEARER + accessToken)
                                .param("approvalStatus", ApprovalStatus.WAITING.name())
                                .param("yearMonth", "2026-04")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].draftId").value(matched.getId()))
                .andExpect(jsonPath("$[0].startAt").value("2026-04-10"))
                .andExpect(jsonPath("$[0].endAt").value("2026-04-12"))
                .andExpect(jsonPath("$[0].destination").value("서울"))
                .andExpect(jsonPath("$[0].purpose").value("고객 미팅"))
                .andExpect(jsonPath("$[0].approvalStatus").value("결재대기"));
    }

    private BusinessTripDraft saveSubmittedBusinessTripDraft(
            Emp drafter,
            Emp approver,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose
    ) {
        BusinessTripDraft draft = BusinessTripDraft.createSubmitted(
                drafter,
                "출장 신청",
                "출장 신청 내용",
                startAt,
                endAt,
                destination,
                purpose,
                List.of(drafter),
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, approver)),
                LocalDateTime.of(2026, 4, 1, 9, 0)
        );

        draftRepository.save(draft);
        return draft;
    }

    private void saveSubmittedBusinessTripCancelDraft(Emp drafter, Emp approver, String sourceKey) {
        BusinessTripCancelDraft cancelDraft = BusinessTripCancelDraft.createSubmitted(
                drafter,
                "출장 취소",
                "출장 취소 내용",
                sourceKey,
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, approver)),
                LocalDateTime.of(2026, 4, 15, 9, 0)
        );

        draftRepository.save(cancelDraft);
    }
}
