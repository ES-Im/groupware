package com.haruon.groupware.adapter.docs.webapi.employee.account;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.employee.account.EmpApi;
import com.haruon.groupware.application.employee.account.provided.forCommand.EmpAccountManager;
import com.haruon.groupware.application.employee.account.provided.forRetriever.EmpAccountRetriever;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpRegisterRequest;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpInfoResponse;
import com.haruon.groupware.application.exception.employee.emp.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.employee.emp.DuplicateLoginIdException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;

import static com.haruon.groupware.adapter.docs.webapi.employee.empApiSupport.getEmpInfoResponse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class EmpApiDocsTest extends RestDocsSupport {

    private final EmpAccountManager empAccountManager = mock(EmpAccountManager.class);
    private final EmpAccountRetriever empAccountRetriever = mock(EmpAccountRetriever.class);

    @Override
    protected Object initController() {
        return new EmpApi(empAccountManager, empAccountRetriever);
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
                ).andExpect(status().isNoContent())
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
                .when(empAccountManager).registerEmp(any(EmpRegisterRequest.class));

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
                .when(empAccountManager).registerEmp(any(EmpRegisterRequest.class));

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
    @DisplayName("사원 단건 조회")
    void getEmp_success() throws Exception {
        EmpInfoResponse empInfoResponse = getEmpInfoResponse();

        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(eq(1L)))
                .thenReturn(empInfoResponse);

        mockMvc.perform(
                get("/api/employees/{empId}", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", "accessToken")
        )
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_EMP_INFO",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        pathParameters(
                                parameterWithName("empId").description("사원 식별 번호")
                        ),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        responseFields(
                                fieldWithPath("empBasicInfo").type(JsonFieldType.OBJECT).description("사원의 기본정보"),
                                fieldWithPath("empBasicInfo.empId").type(JsonFieldType.NUMBER).description("사원 식별 번호(PK)"),
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
}

