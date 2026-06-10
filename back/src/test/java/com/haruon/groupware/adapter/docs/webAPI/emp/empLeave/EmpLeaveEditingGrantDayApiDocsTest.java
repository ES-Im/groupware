package com.haruon.groupware.adapter.docs.webAPI.emp.empLeave;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.empLeave.EmpLeaveEditingGrantDayApi;
import com.haruon.groupware.application.empInfo.leave.provided.LeaveGrantManagement;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class EmpLeaveEditingGrantDayApiDocsTest extends RestDocsSupport {

    private final LeaveGrantManagement leaveGrantManagement = mock(LeaveGrantManagement.class);

    @Override
    protected Object initController() {
        return new EmpLeaveEditingGrantDayApi(leaveGrantManagement);
    }

    @Test
    @DisplayName("특별 휴가 부여일수 조정 문서")
    void adjust_special_grant_days() throws Exception {
        Mockito.doNothing()
                .when(leaveGrantManagement)
                .adjustSpecialGrantDays(1L, 2L, 1.5);

        mockMvc.perform(
                        patch("/api/employees/{empId}/leaves/special-grant-days", 2L)
                                .with(adminAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("plusMinusDays", "1.5")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("plusMinusDays").description("증감할 특별 휴가 부여 일수. 음수 입력 시 차감")
                        )
                ));
    }

    @Test
    @DisplayName("포상 휴가 부여일수 조정 문서")
    void adjust_compensatory_grant_days() throws Exception {
        Mockito.doNothing()
                .when(leaveGrantManagement)
                .adjustCompensatoryGrantDays(1L, 2L, 1.5);

        mockMvc.perform(
                        patch("/api/employees/{empId}/leaves/compensatory-grant-days", 2L)
                                .with(adminAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("plusMinusDays", "1.5")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("EMP_LEAVE_ADJUST_COMPENSATORY_GRANT_DAYS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("plusMinusDays").description("증감할 포상 휴가 부여 일수. 음수 입력 시 차감")
                        )
                ));
    }

    private RequestPostProcessor adminAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "admin",
                "password",
                List.of(SystemRoleCode.ADMIN),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                empDetails,
                null,
                empDetails.getAuthorities()
        ));
    }
}
