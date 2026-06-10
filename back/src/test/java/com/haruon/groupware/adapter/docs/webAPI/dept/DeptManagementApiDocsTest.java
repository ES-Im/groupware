package com.haruon.groupware.adapter.docs.webAPI.dept;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.dept.DeptManagementApi;
import com.haruon.groupware.application.dept.deptService.dto.request.DeptRegisterRequest;
import com.haruon.groupware.application.dept.provided.DeptManagement;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DeptManagementApiDocsTest extends RestDocsSupport {

    private final DeptManagement deptManagement = mock(DeptManagement.class);
    private final static String REQUEST_MAPPING = "/api/departments";

    @Override
    protected Object initController() {
        return new DeptManagementApi(deptManagement);
    }

    @Test
    @DisplayName("부서 등록")
    void registerDept() throws Exception {
        DeptRegisterRequest request = DeptRegisterRequest.builder()
                .deptCode("001")
                .deptName("인사과")
                .build();

        Mockito.doNothing()
                .when(deptManagement).registerDept(eq(1L), eq(request));

        mockMvc.perform(
                post(REQUEST_MAPPING)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_REGISTER",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("deptCode").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("3자리 숫자"))
                                        .description("부서 코드"),
                                fieldWithPath("deptName").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("부서명")
                        )
                    )
                );
    }

    @Test
    @DisplayName("부서 활성화")
    void activateDept() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).activate(eq(1L), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/activation", 1L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_ACTIVATE",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        )
                    )
                );
    }

    @Test
    @DisplayName("부서 비활성화")
    void deactivateDept() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).deactivate(eq(1L), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/deactivation", 1L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_DEACTIVATE",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        )
                    )
                );
    }

    @Test
    @DisplayName("부서명 변경")
    void updateDeptName() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).updateDeptName(eq(1L), eq("인사기획팀"), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/name", 1L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("newName", "인사기획팀")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_UPDATE_NAME",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("newName").description("변경할 부서명")
                        )
                    )
                );
    }

    @Test
    @DisplayName("상위 부서 변경")
    void updateParentDept() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).changeParentDept(eq(2L), eq(1L), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/parent", 2L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("parentDeptId", "1")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_UPDATE_PARENT",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("parentDeptId").optional().description("상위 부서 식별 번호, 미입력 시 최상위 부서로 변경")
                        )
                    )
                );
    }

    @Test
    @DisplayName("부서장 지정")
    void appointDeptLeader() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).appointLeader(eq(1L), eq(2L), eq(LocalDate.of(2026, 2, 1)), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/leader/appointment", 1L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("leaderEmpId", "2")
                        .queryParam("appointedAt", "2026-02-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_APPOINT_LEADER",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("leaderEmpId").description("부서장으로 지정할 사원 식별 번호"),
                                parameterWithName("appointedAt").description("부서장 지정 시작일, yyyy-MM-dd")
                        )
                    )
                );
    }

    @Test
    @DisplayName("현재 부서장 종료")
    void endCurrentDeptLeader() throws Exception {
        Mockito.doNothing()
                .when(deptManagement).endCurrentLeader(eq(1L), eq(LocalDate.of(2026, 3, 1)), eq(1L));

        mockMvc.perform(
                patch(REQUEST_MAPPING + "/{deptId}/leader/end", 1L)
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("endAt", "2026-03-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("DEPT_END_LEADER",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("deptId").description("부서 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("endAt").description("부서장 지정 종료일, yyyy-MM-dd")
                        )
                    )
                );
    }

    private static RequestPostProcessor adminAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "admin",
                "password",
                List.of(SystemRoleCode.ADMIN),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }
}
