package com.haruon.groupware.adapter.docs.webAPI;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.EmpAccountApi;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpFileReplaceParam;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.empInfo.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.empInfo.DuplicateLoginIdException;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
public class EmpAccountRestApiDocsTest extends RestDocsSupport {

    private final EmpAccountManager empAccountManager = mock(EmpAccountManager.class);
    private final EmpAccountRetriever empAccountRetriever = mock(EmpAccountRetriever.class);

    @Override
    protected Object initController() {
        return new EmpAccountApi(empAccountManager, empAccountRetriever);
    }

    @Test
    @DisplayName("회원가입 성공 케이스")
    void register_success() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest(
                "202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        mockMvc.perform(
                post("/api/employees")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                ).andExpect(status().isOk())
                .andDo(document("REGISTER",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestFields(
                            fieldWithPath("empNo")
                                    .description("사원번호")
                                    .attributes(key("constraints").value("9자리[입사연월+3자리번호 조합]")),
                            fieldWithPath("name")
                                    .description("이름")
                                    .attributes(key("constraints").value("20자 이하")),
                            fieldWithPath("loginId")
                                    .description("아이디")
                                    .attributes(key("constraints").value("8자-20자 이하 영어, 숫자")),
                            fieldWithPath("password")
                                    .description("비밀번호")
                                    .attributes(key("constraints").value("8자이상, 영문+숫자+특수문자 조합"))
                        )
                ));
    }

    @Test
    @DisplayName("회원가입 실패 케이스 - 중복 아이디")
    void register_fails1() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest(
                "202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        DuplicateLoginIdException ex = new DuplicateLoginIdException();
        Mockito.doThrow(ex)
                .when(empAccountManager).registerEmp(any(com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest.class));

        mockMvc.perform(
                post("/api/employees")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                ).andExpect(status().is(400))
                .andExpect(jsonPath("$.code").value(ex.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(ex.getErrorCode().getMessage()))
                .andExpect(jsonPath("$.httpStatus").value(ex.getErrorCode().getStatus().value()))
                .andDo(
                    document("REGISTER_DuplicateLoginIdException",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        responseFields(
                                fieldWithPath("code").description("에러 코드"),
                                fieldWithPath("name").description("에러 이름"),
                                fieldWithPath("httpStatus").description("HTTP 상태 코드"),
                                fieldWithPath("message").description("에러 메시지")
                        )
                    )
                );
    }

    @Test
    @DisplayName("회원가입 실패 케이스 - 중복 사원번호")
    void register_fails2() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest(
                "202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        DuplicateEmpNoException ex = new DuplicateEmpNoException();
        Mockito.doThrow(ex)
                .when(empAccountManager).registerEmp(any(com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest.class));

        mockMvc.perform(
                post("/api/employees")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                ).andExpect(status().is(400))
                .andExpect(jsonPath("$.code").value(ex.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(ex.getErrorCode().getMessage()))
                .andExpect(jsonPath("$.httpStatus").value(ex.getErrorCode().getStatus().value()))
                .andDo(
                    document("REGISTER_DuplicateEmpNoException",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        responseFields(
                                fieldWithPath("code").description("에러 코드"),
                                fieldWithPath("name").description("에러 이름"),
                                fieldWithPath("httpStatus").description("HTTP 상태 코드"),
                                fieldWithPath("message").description("에러 메시지")
                        )
                    )
                );
    }

    @Test
    @DisplayName("개인정보 조회 테스트")
    void retriever_me_info_success() throws Exception {
        EmpInfoResponse empInfoResponse = new EmpInfoResponse(
                new EmpBasicInfo("사원번호", "사원명", "아이디", "이메일", "직통번호"),
                List.of(
                        new EmpFileListInfo(1L, "storedFile1", "jpg", 1024L*1024, true, FileType.SIGNATURE),
                        new EmpFileListInfo(2L, "storedFile2", "jpg", 1024*1024L, true, FileType.PROFILE_PICTURE)
                ),
                List.of(
                        new BelongingInfo(1L, "DEPT1", "부서1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                        new BelongingInfo(2L, "DEPT2", "부서2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
                )
        );

        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(any())).thenReturn(empInfoResponse);

        mockMvc.perform(
                get("/api/employees/me")
                        .with(employeeAuthentication())
                        .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_ME_INFO",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("empBasicInfo").type(JsonFieldType.OBJECT).description("사원의 기본정보"),
                                fieldWithPath("empBasicInfo.empNo").type(JsonFieldType.STRING).description("사원 번호"),
                                fieldWithPath("empBasicInfo.name").type(JsonFieldType.STRING).description("사원 이름"),
                                fieldWithPath("empBasicInfo.loginId").type(JsonFieldType.STRING).description("아이디"),
                                fieldWithPath("empBasicInfo.email").type(JsonFieldType.STRING).description("이메일"),
                                fieldWithPath("empBasicInfo.extensionNo").type(JsonFieldType.STRING).description("사무실 번호"),

                                fieldWithPath("activeFiles").type(JsonFieldType.ARRAY).description("활성화된 사원의 프로필/전자서명 이미지 파일"),
                                fieldWithPath("activeFiles[].file").type(JsonFieldType.OBJECT).description("파일 기본 정보"),
                                fieldWithPath("activeFiles[].file.fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("activeFiles[].file.originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("activeFiles[].file.extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("activeFiles[].file.fileSize").type(JsonFieldType.NUMBER).description("파일 크기"),
                                fieldWithPath("activeFiles[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("activeFiles[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부, (True만 출력)"),

                                fieldWithPath("currentDepts").type(JsonFieldType.ARRAY).description("현재 소속정보"),
                                fieldWithPath("currentDepts[].deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                fieldWithPath("currentDepts[].deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                fieldWithPath("currentDepts[].deptName").type(JsonFieldType.STRING).description("부서명"),
                                fieldWithPath("currentDepts[].positionName").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("currentDepts[].isPrimary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
                                fieldWithPath("currentDepts[].startAt").type(JsonFieldType.STRING).description("발령 시작일"),
                                fieldWithPath("currentDepts[].endAt").type(JsonFieldType.NULL).description("종료일, 현재 소속만 출력(현재 소속이면 null)")

                        )

                ));
    }

    @Test
    @DisplayName("개인정보 조회 실패 테스트")
    void retriever_me_info_fail() throws Exception {
        ActiveEmployeeNotFoundException ex = new ActiveEmployeeNotFoundException();
        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(any())).thenThrow(ex);

        mockMvc.perform(
                get("/api/employees/me")
                        .with(employeeAuthentication())
                        .header("Authorization", "accessToken")
                ).andExpect(status().is(ex.getErrorCode().getStatus().value()))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(ex.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(ex.getErrorCode().getMessage()))
                .andExpect(jsonPath("$.httpStatus").value(ex.getErrorCode().getStatus().value()))
                .andDo(document("RETRIEVE_ME_INFO_FAIL",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        responseFields(
                                fieldWithPath("code").description("에러 코드"),
                                fieldWithPath("name").description("에러 이름"),
                                fieldWithPath("httpStatus").description("HTTP 상태 코드"),
                                fieldWithPath("message").description("에러 메시지")
                        )
                ));
    }


    @Test
    @DisplayName("개인파일(프로필, 전자서명) 조회 테스트")
    void retriever_me_files_info_success() throws Exception {
        List<EmpFileListInfo> fileInfos = List.of(
                        new EmpFileListInfo(1L, "storedFile1", "jpg", 1024L*1024, true, FileType.SIGNATURE),
                        new EmpFileListInfo(2L, "storedFile2", "jpg", 1024L*1024, false, FileType.PROFILE_PICTURE)
        );


        Mockito.when(empAccountRetriever.retrieveEmpFilesInfo(any())).thenReturn(fileInfos);

        mockMvc.perform(
                        get("/api/employees/me/files")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_FILES_INFOS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("[].file").type(JsonFieldType.OBJECT).description("파일 기본 정보"),
                                fieldWithPath("[].file.fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("[].file.originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("[].file.extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("[].file.fileSize").type(JsonFieldType.NUMBER).description("파일 크기"),
                                fieldWithPath("[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부")
                        )

                ));
    }


    @Test
    @DisplayName("개인 소속정보 조회 테스트")
    void retriever_belongings_info_success() throws Exception {
        List<BelongingInfo> belongingInfoList = List.of(
                        new BelongingInfo(1L, "DEPT1", "부서1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                        new BelongingInfo(2L, "DEPT2", "부서2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
        );

        Mockito.when(empAccountRetriever.retrieveEmpBelongingsInfo(any())).thenReturn(belongingInfoList);

        mockMvc.perform(
                        get("/api/employees/me/belongings")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_BELONGINGS_INFOS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("[].deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                fieldWithPath("[].deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                fieldWithPath("[].deptName").type(JsonFieldType.STRING).description("부서명"),
                                fieldWithPath("[].positionName").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("[].isPrimary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("발령 시작일"),
                                fieldWithPath("[].endAt").type(JsonFieldType.NULL).description("종료일")
                        )
                ));
    }

    @Test
    @DisplayName("개인정보 변경 테스트")
    void update_me_success() throws Exception {

        EmpUpdateRequestBySelf request = EmpUpdateRequestBySelf.builder()
                .extensionNo("123-4567")
                .newRawPassword("newPassword@123")
                .build();

        Mockito.doNothing().when(empAccountManager).updateInfoBySelf(any(EmpUpdateRequestBySelf.class), anyLong());

        mockMvc.perform(
                patch("/api/employees/me")
                        .with(employeeAuthentication())
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("UPDATE_SELF_INFO",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("extensionNo").type(JsonFieldType.STRING).type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("3자리 숫자 - 4자리 숫자 형식"))
                                        .description("사무실 직통 번호"),
                                fieldWithPath("newRawPassword").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("8자이상, 영문+숫자+특수문자 조합"))
                                        .type(JsonFieldType.STRING).description("새로운 비밀번호")
                        )


                    )
                );

    }

    @Test
    @DisplayName("파일 추가 테스트")
    void addMeFile_success() throws Exception {

        Mockito.doNothing()
                .when(empAccountManager).updateEmpFileBySelf(any(EmpFileReplaceParam.class), anyLong());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "profile.png",
                "image/png",
                "test image content".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(
                        multipart("/api/employees/me/files")
                                .file(file)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .param("fileType", FileType.PROFILE_PICTURE.name())
                                .with(request -> {
                                    request.setMethod("PATCH");
                                    return request;
                                })
                                .contentType(MediaType.MULTIPART_FORM_DATA)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("ADD_EMP_FILES",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestParts(
                                partWithName("file").description("업로드할 사원 파일")
                        )



                    )
                );
    }

    @Test
    @DisplayName("파일 활성화/비활성화 테스트")
    void activate_file() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).updateEmpFileBySelf(any(EmpFileReplaceParam.class), anyLong());

        mockMvc.perform(
                patch("/api/employees/me/files/{fileId}/status", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .param("isForActivate", "true")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("ACTIVATE_ME_FILE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        pathParameters(
                                parameterWithName("fileId").description("파일 식별 번호")
                        )

                    )
                );
    }

    @Test
    @DisplayName("파일 삭제 테스트")
    void deleteFileTest() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).deleteEmpFileBySelf(anyLong(), anyLong());

        mockMvc.perform(
                delete("/api/employees/me/files/{fileId}", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                ).andDo(MockMvcResultHandlers.print())
                .andDo(document("DELETE_ME_FILE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("fileId").description("파일 식별 번호")
                        )
                    )
                );
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
