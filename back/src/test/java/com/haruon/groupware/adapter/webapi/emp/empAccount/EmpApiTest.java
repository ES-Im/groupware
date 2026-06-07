package com.haruon.groupware.adapter.webapi.emp.empAccount;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.EmpRegisterRequest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class EmpApiTest extends IntegrationTestSupport {
    @Autowired
    private EmpAccountRetriever empAccountRetriever;

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

    @Test
    @DisplayName("사원 단건 조회")
    void getEmp_success() throws Exception {
        String accessToken = loginByIdAndPw("login12345", "!Q2w3e4r5t");

        String loginId = "login12346";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        Long empId = empRepository.findByLoginId(loginId).orElseThrow().getId();

        mockMvc.perform(
                get("/api/employees/{empId}", empId)
                        .header("Authorization", "Bearer " + accessToken)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
