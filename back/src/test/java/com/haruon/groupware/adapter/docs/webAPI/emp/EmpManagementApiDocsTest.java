package com.haruon.groupware.adapter.docs.webAPI.emp;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.EmpManagementApi;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestByDeptManager;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestByHR;
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
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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


    @Test
    @DisplayName("회원 가입 가입 승인 (HR)")
    void approve_registration() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).approveRegisterByHR(eq(1L), eq(2L), eq(LocalDate.of(2026, 1, 1)));

        mockMvc.perform(
                patch("/api/employees/{empId}/registration-approval", 2L)
                        .header("Authorization", "Bearer accessToken")
                        .with(hrAuthentication())
                        .queryParam("hiredAt", "2026-01-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("HR_APPROVE_EMP_REGISTRATION",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("hiredAt").description("입사일자, yyyy-MM-dd")
                        )
                    )
                );
    }
    
    @Test
    @DisplayName("회원 퇴직 처리 (HR)")
    void resignation_emp() throws Exception {

        Mockito.doNothing()
                .when(empAccountManager).updateResignedEmpByHR(eq(1L), eq(2L), eq(LocalDate.of(2026, 2, 1)));

        mockMvc.perform(
                patch("/api/employees/{empId}/resignation", 2L)
                        .header("Authorization", "Bearer accessToken")
                        .with(hrAuthentication())
                        .queryParam("hiredAt", "2026-02-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("HR_RESIGN_EMP",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("hiredAt").description("퇴사일자, yyyy-MM-dd")
                        )

                    )
                );
    }

    @Test
    @DisplayName("정직 사원 활성화 처리 (HR)")
    void activate_emp() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).activateEmpByHR(eq(1L), eq(2L));

        mockMvc.perform(
                patch("/api/employees/{empId}/status/activation", 2L)
                        .header("Authorization", "Bearer accessToken")
                        .with(hrAuthentication())
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("HR_ACTIVATE_EMP",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                    )
                );
    }

    @Test
    @DisplayName("사원 정직처리 - (HR)")
    void suspend_emp() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).suspendEmpByHR(eq(1L), eq(2L));

        mockMvc.perform(
                patch("/api/employees/{empId}/status/suspension", 2L)
                        .header("Authorization", "Bearer accessToken")
                        .with(hrAuthentication())
        )
                .andExpect(status().isOk())
                .andDo(document("HR_SUSPEND_EMP",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                    )
                );
    }

    @Test
    @DisplayName("특정 사원의 특정파일 비활성화 - (HR)")
    void update_empFile_status_by_hr() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).updateFileActiveStatusByHR(eq(1L), eq(2L), eq(3L), eq(false));

        mockMvc.perform(
                patch("/api/employees/{empId}/files/{fileId}/status", 2L, 3L)
                        .with(hrAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("isForActivate", "false")
        )
                .andExpect(status().isOk())
                .andDo(document("HR_UPDATE_ONES_FILE_STATUS",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호"),
                                parameterWithName("fileId").description("파일 식별 번호")
                        ),

                        queryParameters(
                                parameterWithName("isForActivate").description("파일 활성화여부 \n true = 활성화 \n false = 비활성화")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                    )
                );
    }

    @Test
    @DisplayName("특정 사원 정보 수정 - HR")
    void update_emp_info_by_hr() throws Exception {
        String newEmployeeName = "새로운 이름";
        String newPassword = "new!Q2w3e4r5t";
        String newExtensionNo = "111-1234";
        Set<SystemRoleCode> newSystemRole = Set.of(SystemRoleCode.FRANCHISE, SystemRoleCode.EMPLOYEE);
        LocalDate newHireAt = LocalDate.of(2024, 1, 1);

        EmpUpdateRequestByHR request = EmpUpdateRequestByHR.builder()
                .empName(newEmployeeName)
                .password(newPassword)
                .extensionNo(newExtensionNo)
                .systemRoleCode(newSystemRole)
                .hireAt(newHireAt)
                .build();

        Mockito.doNothing()
                .when(empAccountManager).updateInfoByHR(eq(1L), eq(2L), any(EmpUpdateRequestByHR.class));


        mockMvc.perform(
                patch("/api/employees/{empId}/hr-managed-info", 2L)
                        .with(hrAuthentication())
                        .header("Authorization", "Bearer AccessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andExpect(status().isOk())
                .andDo(document("HR_UPDATE_EMP_INFO",
                        preprocessRequest(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("empName").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("사원 이름"),
                                fieldWithPath("password").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("8자이상, 영문+숫자+특수문자 조합"))
                                        .type(JsonFieldType.STRING).description("새로운 비밀번호"),
                                fieldWithPath("extensionNo").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("3자리 숫자 - 4자리 숫자 형식"))
                                        .description("사무실 직통 번호"),
                                fieldWithPath("systemRoleCode").type(JsonFieldType.ARRAY)
                                        .attributes(key("constraints").value("-"))
                                        .description("시스템 권한(기존 권한과 상관없이 지정한 권한들로 교체됨, HR은 ADMIN 부여 불가, ADMIN은 전체 부여 가능) \n [EMPLOYEE,DEPT_MANAGER,ADMIN] \n [FRANCHISE,IT,HR,FACILITY]"),
                                fieldWithPath("hireAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("yyyy-MM-dd"))
                                        .description("입사일자")

                        )
                    )
                );
    }

    @Test
    @DisplayName("특정 사원 정보 수정 - DeptManager")
    void update_emp_info_by_deptManager() throws Exception {
        String newExtensionNo = "111-1234";
        Set<SystemRoleCode> newSystemRole = Set.of(SystemRoleCode.FRANCHISE, SystemRoleCode.EMPLOYEE);
        EmpUpdateRequestByDeptManager request = EmpUpdateRequestByDeptManager.builder()
                .systemRoleCode(newSystemRole).extensionNo(newExtensionNo).build();

        Mockito.doNothing()
                .when(empAccountManager).updateInfoByDeptManager(eq(1L), eq(2L), any(EmpUpdateRequestByDeptManager.class));

        mockMvc.perform(
                patch("/api/employees/{empId}/dept-managed-info", 2L)
                        .with(deptManagerAuthentication())
                        .header("Authorization", "Bearer AccessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andExpect(status().isOk())
                .andDo(document("DEPT_MANAGER_UPDATE_EMP_INFO",
                                preprocessRequest(prettyPrint()),

                                pathParameters(
                                        parameterWithName("empId").description("사원 식별 번호")
                                ),

                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),

                                requestFields(
                                        fieldWithPath("extensionNo").type(JsonFieldType.STRING)
                                                .attributes(key("constraints").value("3자리 숫자 - 4자리 숫자 형식"))
                                                .description("사무실 직통 번호"),
                                        fieldWithPath("systemRoleCode").type(JsonFieldType.ARRAY)
                                                .attributes(key("constraints").value("-"))
                                                .description("시스템 권한 \n (기존 권한과 상관없이 지정한 권한들로 교체되며, 부서매니저 상위 권한 부여 불가) \n [EMPLOYEE,DEPT_MANAGER] \n [FRANCHISE,IT,HR,FACILITY 중 부서 매니저가 가진 권한]")
                                )
                        )
                );
    }








}
