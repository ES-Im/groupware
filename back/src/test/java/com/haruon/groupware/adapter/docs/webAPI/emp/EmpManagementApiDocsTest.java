package com.haruon.groupware.adapter.docs.webAPI.emp;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.EmpManagementApi;
import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpBasicInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoForManagement;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
public class EmpManagementApiDocsTest extends RestDocsSupport {

    private final EmpAccountManager empAccountManager = mock(EmpAccountManager.class);
    private final EmpAccountRetriever empAccountRetriever = mock(EmpAccountRetriever.class);

    @Override
    protected Object initController() {
        return new EmpManagementApi(empAccountManager, empAccountRetriever);
    }


    @Test
    @DisplayName("사원관리 리스트 - ADMIN")
    void empForManagementByAdmin() throws Exception {
        BelongingInfo belongingInfo = new BelongingInfo(
                1L, "A001", "인사과",
                PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2024, 1, 1), null
        );

        List<EmpInfoForManagement> content = List.of(
                new EmpInfoForManagement(
                        1L, "EMP001", "홍길동", "hong", "hong@test.com",
                        "1234", EmpStatus.ACTIVE, LocalDate.of(2024, 1, 1),
                        null,
                        List.of(belongingInfo), List.of(SystemRoleCode.ADMIN)
                )
        );

        Page<EmpInfoForManagement> page = new PageImpl<>(
                content,
                PageRequest.of(0, 10),
                content.size()
        );

        EmpDetails empDetails = new EmpDetails(
                "admin",
                "password",
                List.of(SystemRoleCode.ADMIN),
                List.of(belongingInfo),
                EmpStatus.ACTIVE,
                1L
        );

        Mockito.when(empAccountRetriever.retrieveEmpAccountInfoListForManagement(
                nullable(Long.class),
                nullable(List.class),
                eq(1L),
                eq(EmpStatus.ACTIVE),
                eq("홍"),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(
                get("/api/employees")
                        .with(authentication(
                                new UsernamePasswordAuthenticationToken(
                                        empDetails,
                                        null,
                                        empDetails.getAuthorities()
                                )
                        ))
                        .header("Authorization", "Bearer accessToken")
                        .param("deptId", "1")
                        .param("status", EmpStatus.ACTIVE.name())
                        .param("keyword", "홍")
                        .param("page", "0")
                        .param("size", "10")
                )
                .andExpect(status().isOk())
                .andDo(MockMvcResultHandlers.print())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content[0].empId").value(1L))
                .andExpect(jsonPath("$.content[0].empName").value("홍길동"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0))
                .andDo(document("EMPS_FOR_MANAGEMENT",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("deptId").optional().description("부서 식별 번호"),
                                parameterWithName("status").optional().description("사원 상태"),
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(
                                fieldWithPath("content").type(JsonFieldType.ARRAY).description("사원 목록"),
                                fieldWithPath("content[].empId").type(JsonFieldType.NUMBER).description("사원 식별 번호"),
                                fieldWithPath("content[].empNo").type(JsonFieldType.STRING).description("사원 번호"),
                                fieldWithPath("content[].empName").type(JsonFieldType.STRING).description("사원 이름"),
                                fieldWithPath("content[].loginId").type(JsonFieldType.STRING).description("아이디"),
                                fieldWithPath("content[].email").type(JsonFieldType.STRING).description("이메일"),
                                fieldWithPath("content[].extensionNo").type(JsonFieldType.STRING).description("사무실 번호").optional(),
                                fieldWithPath("content[].status").type(JsonFieldType.STRING).description("사원 근무 상태"),
                                fieldWithPath("content[].hireAt").type(JsonFieldType.STRING).description("입사일자"),
                                fieldWithPath("content[].resignAt").type(JsonFieldType.NULL).description("퇴사일자").optional(),

                                fieldWithPath("content[].belongings").type(JsonFieldType.ARRAY).description("소속 정보 목록"),
                                fieldWithPath("content[].belongings[].deptId").type(JsonFieldType.NUMBER).description("소속부서 식별 번호"),
                                fieldWithPath("content[].belongings[].deptCode").type(JsonFieldType.STRING).description("소속부서 코드"),
                                fieldWithPath("content[].belongings[].deptName").type(JsonFieldType.STRING).description("소속부서명"),
                                fieldWithPath("content[].belongings[].positionName").type(JsonFieldType.STRING).description("소속부서 내 직급"),
                                fieldWithPath("content[].belongings[].isPrimary").type(JsonFieldType.BOOLEAN).description("주요 부서 여부"),
                                fieldWithPath("content[].belongings[].startAt").type(JsonFieldType.STRING).description("소속 부서 발령일자"),
                                fieldWithPath("content[].belongings[].endAt").type(JsonFieldType.NULL).description("소속 부서 발령 종료일자").optional(),

                                fieldWithPath("content[].systemRoleCodeName").type(JsonFieldType.ARRAY).description("시스템 권한"),

                                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 사원 수"),
                                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                                subsectionWithPath("pageable").ignored(),
                                subsectionWithPath("sort").ignored()
                        )

                    )
                );
    }

    @Test
    @DisplayName("신규사원 관리용 사원리스트 조회 - SystemRole = HR은 신규사원(status = PENDING)을 조회할 수 있다")
    void newEmpsForManagementByHR() throws Exception {
        EmpDetails details = new EmpDetails(
                "hr",
                "password",
                List.of(SystemRoleCode.HR),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        log.info("details = {}", details.getEmpId());

        EmpBasicInfo empBasicInfo = new EmpBasicInfo(
                "202605001", "신규사원", "newLoginId123", "newLoginId123@haruon.com", ""
        );
        Page<EmpBasicInfo> page = new PageImpl<>(
                List.of(empBasicInfo),
                PageRequest.of(0, 10),
                1
        );

        Mockito.when(empAccountRetriever.retrieveNewEmpInfoList(
                eq(1L), eq("신규사원"), any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(
                        get("/api/employees/new")
                                .header("Authorization", "Bearer accessToken")
                                .with(authentication(
                                        new UsernamePasswordAuthenticationToken(
                                                details,
                                                null,
                                                details.getAuthorities()
                                        )
                                ))
                                .param("page", "0")
                                .param("size", "10")
                                .param("keyword", "신규사원")
                )
                .andExpect(status().isOk())
                .andDo(MockMvcResultHandlers.print())
                .andExpect(jsonPath("$.content[0].name").value("신규사원"))
                .andDo(document("NEW_EMP_LIST",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(
                                fieldWithPath("content").type(JsonFieldType.ARRAY).description("신규 사원 목록"),
                                fieldWithPath("content[].empNo").type(JsonFieldType.STRING).description("사원 번호"),
                                fieldWithPath("content[].name").type(JsonFieldType.STRING).description("사원 이름"),
                                fieldWithPath("content[].loginId").type(JsonFieldType.STRING).description("로그인 ID"),
                                fieldWithPath("content[].email").type(JsonFieldType.STRING).description("이메일"),
                                fieldWithPath("content[].extensionNo").type(JsonFieldType.STRING).description("내선 번호"),

                                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("신규 사원 수"),
                                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                                subsectionWithPath("pageable").ignored(),
                                subsectionWithPath("sort").ignored()
                        )
                    )
                );

        Mockito.verify(empAccountRetriever).retrieveNewEmpInfoList(
                eq(1L),
                eq("신규사원"),
                any(Pageable.class)
        );
    }








}
