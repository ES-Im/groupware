package com.haruon.groupware.adapter.docs.webapi.employee.leave;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.employee.leave.EmployeeLeaveQueryApi;
import com.haruon.groupware.application.employee.leave.provided.forRetriever.LeaveRetriever;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveUsageSummaryResponse;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class EmployeeLeaveQueryApiDocsTest extends RestDocsSupport {

    private final LeaveRetriever leaveRetriever = mock(LeaveRetriever.class);

    @Override
    protected Object initController() {
        return new EmployeeLeaveQueryApi(leaveRetriever);
    }

    @Test
    @DisplayName("내 잔여 휴가 요약 조회 문서")
    void retrieve_my_leave_summary() throws Exception {
        LeaveSummaryResponse response = leaveSummaryResponse();

        Mockito.when(leaveRetriever.retrieverMyLeaveSummary(
                eq(1L),
                eq(2026)
        )).thenReturn(response);

        mockMvc.perform(
                        get("/api/employees/me/leaves/summary")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("year", "2026")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_EMP_LEAVE_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("year").optional().description("조회 대상 연도, yyyy. 미입력 시 현재 연도")
                        ),

                        responseFields(leaveSummaryFields())
                ));
    }

    @Test
    @DisplayName("관리자 사원 휴가 요약 조회 문서")
    void retrieve_emp_leave_summary() throws Exception {
        Page<LeaveSummaryAndEmpInfoResponse> response = leaveSummaryPage();

        Mockito.when(leaveRetriever.retrieverLeaveSummary(
                eq(1L),
                eq("홍"),
                eq(2L),
                eq(2026),
                any(Pageable.class),
                eq(true)
        )).thenReturn(response);

        mockMvc.perform(
                        get("/api/employees/leaves/summary")
                                .with(adminAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "홍")
                                .queryParam("deptId", "2")
                                .queryParam("year", "2026")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("EMP_LEAVE_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("deptId").optional().description("부서 식별 번호"),
                                parameterWithName("year").optional().description("조회 대상 연도, yyyy. 미입력 시 현재 연도"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(leaveSummaryPageFields())
                ));
    }

    @Test
    @DisplayName("관리자 회사 휴가 사용률 조회 문서")
    void retrieve_emp_leave_usage_summary() throws Exception {
        Mockito.when(leaveRetriever.retrieverLeaveUsageSummary(
                eq(1L),
                eq(2L),
                eq(2026),
                eq(true)
        )).thenReturn(new LeaveUsageSummaryResponse(25.0));

        mockMvc.perform(
                        get("/api/employees/leaves/usage-summary")
                                .with(adminAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("deptId", "2")
                                .queryParam("year", "2026")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("EMP_LEAVE_USAGE_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("deptId").optional().description("부서 식별 번호"),
                                parameterWithName("year").optional().description("조회 대상 연도, yyyy. 미입력 시 현재 연도")
                        ),

                        responseFields(leaveUsageSummaryFields())
                ));
    }

    @Test
    @DisplayName("부서 사원 휴가 요약 조회 문서")
    void retrieve_dept_emp_leave_summary() throws Exception {
        Page<LeaveSummaryAndEmpInfoResponse> response = leaveSummaryPage();

        Mockito.when(leaveRetriever.retrieverLeaveSummary(
                eq(1L),
                eq("홍"),
                eq(2L),
                eq(2026),
                any(Pageable.class),
                eq(false)
        )).thenReturn(response);

        mockMvc.perform(
                        get("/api/departments/{deptId}/employees/leaves/summary", 2L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "홍")
                                .queryParam("year", "2026")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DEPT_EMP_LEAVE_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("year").optional().description("조회 대상 연도, yyyy. 미입력 시 현재 연도"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(leaveSummaryPageFields())
                ));
    }

    @Test
    @DisplayName("부서 휴가 사용률 조회 문서")
    void retrieve_dept_emp_leave_usage_summary() throws Exception {
        Mockito.when(leaveRetriever.retrieverLeaveUsageSummary(
                eq(1L),
                eq(2L),
                eq(2026),
                eq(false)
        )).thenReturn(new LeaveUsageSummaryResponse(20.0));

        mockMvc.perform(
                        get("/api/departments/{deptId}/employees/leaves/usage-summary", 2L)
                                .with(deptManagerAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("year", "2026")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DEPT_EMP_LEAVE_USAGE_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("year").optional().description("조회 대상 연도, yyyy. 미입력 시 현재 연도")
                        ),

                        responseFields(leaveUsageSummaryFields())
                ));
    }

    private Page<LeaveSummaryAndEmpInfoResponse> leaveSummaryPage() {
        LeaveSummaryAndEmpInfoResponse content = new LeaveSummaryAndEmpInfoResponse(
                "202604001",
                "홍길동",
                "IT",
                "사원",
                leaveSummaryResponse()
        );

        return new PageImpl<>(
                List.of(content),
                PageRequest.of(0, 10),
                1
        );
    }

    private LeaveSummaryResponse leaveSummaryResponse() {
        return new LeaveSummaryResponse(
                15.0,
                2.0,
                1.0,
                0.5,
                3.0,
                1.0
        );
    }

    private FieldDescriptor[] leaveSummaryFields() {
        return new FieldDescriptor[] {
                fieldWithPath("annualBaseGrantDays").type(JsonFieldType.NUMBER).description("기본 연차 부여 일수"),
                fieldWithPath("annualUsedDays").type(JsonFieldType.NUMBER).description("기본 연차 사용 일수"),
                fieldWithPath("specialGrantDays").type(JsonFieldType.NUMBER).description("특별 휴가 부여 일수"),
                fieldWithPath("specialUsedDays").type(JsonFieldType.NUMBER).description("특별 휴가 사용 일수"),
                fieldWithPath("compensatoryGrantDays").type(JsonFieldType.NUMBER).description("포상 휴가 부여 일수"),
                fieldWithPath("compensatoryUsedDays").type(JsonFieldType.NUMBER).description("포상 휴가 사용 일수")
        };
    }

    private FieldDescriptor[] leaveSummaryPageFields() {
        return concat(new FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("사원 휴가 요약 목록"),
                fieldWithPath("content[].empNo").type(JsonFieldType.STRING).description("사원 번호"),
                fieldWithPath("content[].empName").type(JsonFieldType.STRING).description("사원 이름"),
                fieldWithPath("content[].deptName").type(JsonFieldType.STRING).description("부서 이름"),
                fieldWithPath("content[].positionName").type(JsonFieldType.STRING).description("직책 이름"),
                fieldWithPath("content[].leaveSummary").type(JsonFieldType.OBJECT).description("휴가 요약"),
                fieldWithPath("content[].leaveSummary.annualBaseGrantDays").type(JsonFieldType.NUMBER).description("기본 연차 부여 일수"),
                fieldWithPath("content[].leaveSummary.annualUsedDays").type(JsonFieldType.NUMBER).description("기본 연차 사용 일수"),
                fieldWithPath("content[].leaveSummary.specialGrantDays").type(JsonFieldType.NUMBER).description("특별 휴가 부여 일수"),
                fieldWithPath("content[].leaveSummary.specialUsedDays").type(JsonFieldType.NUMBER).description("특별 휴가 사용 일수"),
                fieldWithPath("content[].leaveSummary.compensatoryGrantDays").type(JsonFieldType.NUMBER).description("포상 휴가 부여 일수"),
                fieldWithPath("content[].leaveSummary.compensatoryUsedDays").type(JsonFieldType.NUMBER).description("포상 휴가 사용 일수")
        }, pageMetadataFields());
    }

    private FieldDescriptor[] leaveUsageSummaryFields() {
        return new FieldDescriptor[] {
                fieldWithPath("annualLeaveUsagePercent").type(JsonFieldType.NUMBER).description("기본 연차 사용률")
        };
    }

    private FieldDescriptor[] pageMetadataFields() {
        return new FieldDescriptor[] {
                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 데이터 수"),
                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),
                subsectionWithPath("pageable").ignored(),
                subsectionWithPath("sort").ignored()
        };
    }

    private FieldDescriptor[] concat(FieldDescriptor[] first, FieldDescriptor[] second) {
        FieldDescriptor[] result = new FieldDescriptor[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
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
