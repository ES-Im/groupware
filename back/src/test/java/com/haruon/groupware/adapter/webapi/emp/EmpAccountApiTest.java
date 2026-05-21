package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.IntegrityTestFixtures;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpRegisterRequest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
class EmpAccountApiTest extends IntegrationTestSupport {

    @Test
    @DisplayName("회원가입 성공 테스트")
    void register_success() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest("202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        mockMvc.perform(
                post("/api/emp")
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
                post("/api/emp")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("개인정보 조회 테스트")
    void retriever_me_info_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        log.info("accessToken : {}", accessToken);
        log.info("개인정보조회 시작");
        MvcResult result = mockMvc.perform(
                        get("/api/emp/me")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("empBasicInfo");
        assertThat(result.getResponse().getContentAsString()).contains("activeFiles");
        assertThat(result.getResponse().getContentAsString()).contains("currentDepts");
    }

    @Test
    @DisplayName("개인 프로필/전자서명 이미지 모두 조회")
    void meFiles_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        MvcResult result = mockMvc.perform(
                        get("/api/emp/me/files")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("fileId");
    }

    @Test
    @DisplayName("개인 프로필/전자서명 이미지 모두 조회")
    void belongings_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        MvcResult result = mockMvc.perform(
                        get("/api/emp/me/belongings")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("position");
    }





    private void registerEmpHavingAllInfo(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingAllInfo(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    private String loginByIdAndPw(String loginId, String password) throws Exception {
        return IntegrityTestFixtures.getAccessToken(
                empRepository, encoder, mockMvc, objectMapper, loginId, password
        );
    }


}