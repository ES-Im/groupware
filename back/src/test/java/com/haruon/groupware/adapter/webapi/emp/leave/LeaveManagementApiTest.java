package com.haruon.groupware.adapter.webapi.emp.leave;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.required.LeaveDraftRepository;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class LeaveManagementApiTest extends IntegrationTestSupport {

    @Autowired
    private LeaveDraftRepository leaveDraftRepository;

    @Autowired
    private DraftRepository draftRepository;

    @Autowired
    private CompanyPolicyPort companyPolicyPort;

    @AfterEach
    void tearDownLeaveDraft() {
        draftRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("부서 휴가 신청 이력 조회 - 부서 매니저는 같은 부서원의 신청 이력을 조회한다")
    void deptLeaveRequestHistories_success() throws Exception {
        String password = "!Q2w3e4r5t";
        Dept dept = getDept("002", "IT");

        String managerLoginId = "manager12345";
        registerDeptManager(managerLoginId, password, dept);
        String managerAccessToken = loginByIdAndPw(managerLoginId, password);

        String targetLoginId = "employee12345";
        registerEmpHavingAllInfo(targetLoginId, password);
        Emp targetEmp = empRepository.findByLoginId(targetLoginId).orElseThrow();

        String otherLoginId = "employee12346";
        activatedEmp(otherLoginId, password);
        Emp otherEmp = empRepository.findByLoginId(otherLoginId).orElseThrow();

        String approverLoginId = "approver12345";
        activatedEmp(approverLoginId, password);
        Emp approver = empRepository.findByLoginId(approverLoginId).orElseThrow();

        long actualWorkHour = actualWorkHour();
        LeaveDraft matched = saveSubmittedLeaveDraft(
                targetEmp,
                approver,
                LeaveType.ANNUAL,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 10, 18, 0),
                actualWorkHour
        );
        saveSubmittedLeaveDraft(
                otherEmp,
                approver,
                LeaveType.ANNUAL,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 10, 18, 0),
                actualWorkHour
        );

        mockMvc.perform(
                        get("/api/employees/{deptId}/leaves/request-history", dept.getId())
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
                .andExpect(jsonPath("$.content[0].historyResponse.leaveType").value("연차"))
                .andExpect(jsonPath("$.content[0].historyResponse.requestedLeaveDays").value(1.0))
                .andExpect(jsonPath("$.content[0].historyResponse.approvalStatus").value("결재대기"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    private LeaveDraft saveSubmittedLeaveDraft(
            Emp drafter,
            Emp approver,
            LeaveType leaveType,
            LocalDateTime startAt,
            LocalDateTime endAt,
            long reservedHours
    ) {
        return leaveDraftRepository.save(
                LeaveDraft.createSubmitted(
                        drafter,
                        "휴가 신청",
                        "휴가 신청 내용",
                        startAt,
                        endAt,
                        leaveType,
                        List.of(new ApproversParam(ApprovalRole.APPROVER, 1, approver)),
                        LocalDateTime.of(2026, 4, 1, 9, 0),
                        reservedHours
                )
        );
    }

    private int actualWorkHour() {
        return companyPolicyPort.getWorkHours();
    }
}
