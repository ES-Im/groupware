package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class EmpApiTest extends IntegrationTestSupport {

    @Test
    @DisplayName("회원가입 성공 테스트")
    void register_success() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest("202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        mockMvc.perform(
                post("/api/employees")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(status().isOk());
    }

    @Test
    @DisplayName("회원가입 실패 테스트")
    void register_fail() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        loginByIdAndPw(loginId, password);

        EmpRegisterRequest request = new EmpRegisterRequest("202601999", "홍길동", loginId, password);

        mockMvc.perform(
                post("/api/employees")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(status().is4xxClientError());
    }

    //todo - 사원 단건 조회
}
