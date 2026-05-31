package com.haruon.groupware.adapter.docs.webAPI.emp;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.EmpApi;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.application.exception.empInfo.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.empInfo.DuplicateLoginIdException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    //todo : ResponseEntity<EmpInfoResponse> get 테스트 필요
}

