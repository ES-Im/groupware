package com.haruon.groupware.adapter.docs.webAPI;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.EmpAccountApi;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequestBySelf;
import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpBasicInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.empInfo.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.empInfo.DuplicateLoginIdException;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
                post("/api/emp")
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
                .when(empAccountManager).registerEmp(any(EmpRegisterRequestBySelf.class));

        mockMvc.perform(
                post("/api/emp")
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
                .when(empAccountManager).registerEmp(any(EmpRegisterRequestBySelf.class));

        mockMvc.perform(
                post("/api/emp")
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
                        new EmpFileInfo(1L, "storedFile1", "jpg", FileType.SIGNATURE, true),
                        new EmpFileInfo(2L, "storedFile2", "jpg", FileType.PROFILE_PICTURE, true)
                ),
                List.of(
                        new BelongingInfo(1L, "DEPT1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                        new BelongingInfo(2L, "DEPT2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
                )
        );

        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(any())).thenReturn(empInfoResponse);

        mockMvc.perform(
                get("/api/emp/me")
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
                                fieldWithPath("activeFiles[].fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("activeFiles[].originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("activeFiles[].extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("activeFiles[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("activeFiles[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부, (True만 출력)"),

                                fieldWithPath("currentDepts").type(JsonFieldType.ARRAY).description("현재 소속정보"),
                                fieldWithPath("currentDepts[].id").type(JsonFieldType.NUMBER).description("소속정보 식별 번호"),
                                fieldWithPath("currentDepts[].dept").type(JsonFieldType.STRING).description("소속 부서"),
                                fieldWithPath("currentDepts[].position").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("currentDepts[].primary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
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
                get("/api/emp/me")
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
        List<EmpFileInfo> fileInfos = List.of(
                        new EmpFileInfo(1L, "storedFile1", "jpg", FileType.SIGNATURE, true),
                        new EmpFileInfo(2L, "storedFile2", "jpg", FileType.PROFILE_PICTURE, false)
        );


        Mockito.when(empAccountRetriever.retrieveEmpFilesInfo(any())).thenReturn(fileInfos);

        mockMvc.perform(
                        get("/api/emp/me/files")
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
                                fieldWithPath("[].fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("[].originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("[].extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부")
                        )

                ));
    }


    @Test
    @DisplayName("개인 소속정보 조회 테스트")
    void retriever_belongings_info_success() throws Exception {
        List<BelongingInfo> belongingInfoList = List.of(
                        new BelongingInfo(1L, "DEPT1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                        new BelongingInfo(2L, "DEPT2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
        );

        Mockito.when(empAccountRetriever.retrieveEmpBelongingsInfo(any())).thenReturn(belongingInfoList);

        mockMvc.perform(
                        get("/api/emp/me/belongings")
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
                                fieldWithPath("[].id").type(JsonFieldType.NUMBER).description("소속정보 식별 번호"),
                                fieldWithPath("[].dept").type(JsonFieldType.STRING).description("소속 부서"),
                                fieldWithPath("[].position").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("[].primary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("발령 시작일"),
                                fieldWithPath("[].endAt").type(JsonFieldType.NULL).description("종료일")

                        )

                ));
    }





}
