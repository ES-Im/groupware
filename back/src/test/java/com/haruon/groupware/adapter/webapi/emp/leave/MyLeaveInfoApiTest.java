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

public class MyLeaveInfoApiTest extends IntegrationTestSupport {

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
    @DisplayName("내 휴가 신청 이력 조회 - 상태와 월 조건으로 본인 신청 이력만 조회한다")
    void myLeaveRequestHistories_success() throws Exception {
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

        long actualWorkHour = actualWorkHour();
        LeaveDraft matched = saveSubmittedLeaveDraft(
                emp,
                approver,
                LeaveType.ANNUAL,
                LocalDateTime.of(2026, 4, 10, 9, 0),
                LocalDateTime.of(2026, 4, 10, 18, 0),
                actualWorkHour
        );
        saveSubmittedLeaveDraft(
                emp,
                approver,
                LeaveType.ANNUAL,
                LocalDateTime.of(2026, 5, 10, 9, 0),
                LocalDateTime.of(2026, 5, 10, 18, 0),
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

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/employees/me/leaves/request-history")
                                .header("Authorization", BEARER + accessToken)
                                .param("approvalStatus", ApprovalStatus.WAITING.name())
                                .param("yearMonth", "2026-04")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].draftId").value(matched.getId()))
                .andExpect(jsonPath("$[0].leaveType").value("연차"))
                .andExpect(jsonPath("$[0].startAt").value("2026-04-10"))
                .andExpect(jsonPath("$[0].endAt").value("2026-04-10"))
                .andExpect(jsonPath("$[0].requestedLeaveDays").value(1.0))
                .andExpect(jsonPath("$[0].approvalStatus").value("결재대기"));
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
