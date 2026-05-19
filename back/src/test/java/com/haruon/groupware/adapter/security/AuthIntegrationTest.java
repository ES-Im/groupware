package com.haruon.groupware.adapter.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.redis.RefreshTokenRedis;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.adapter.webapi.exception.auth.InvalidLoginException;
import com.haruon.groupware.application.auth.provided.AuthManagement;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import jakarta.servlet.http.Cookie;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static com.haruon.groupware.adapter.IntegrityTestFixtures.registerAndApproveEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired StringRedisTemplate redisTemplate;
    @Autowired AuthManagement authManagement;
    @Autowired JwtCookieManager jwtCookieManager;
    @Autowired RefreshTokenRedis refreshTokenRedis;
    @Autowired
    EmpAccountManager empAccountManager;
    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    EmpRepository empRepository;
    @Autowired
    EmpPasswordEncoder empPasswordEncoder;

    @AfterEach
    void tearDown() {
        empRepository.deleteAll();
        redisTemplate.delete("auth:refresh:test12345");
    }

    public String getValueInRedis(String key) {
        return redisTemplate.opsForValue().get(key);
    }


    @Test
    @DisplayName("로그인 후, 바디로 access_token, 쿠키로 refresh_token이 전달 + Redis에 refreshToken이 저장된다.")
    void login_saves_refresh_token_to_redis() throws Exception {
        String loginId = "test12345";
        String password = "!Q2w3e4r5t";
        registerAndApproveEmp(empRepository, empPasswordEncoder, loginId, password);

        EmpLoginRequest request = new EmpLoginRequest(loginId, password);

        MvcResult result = mockMvc.perform(
                        post("/api/auth/login")
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("refreshToken");

        String saved = redisTemplate.opsForValue()
                .get("auth:refresh:" + request.loginId());

        assertThat(saved).isNotNull();
        assertThat(saved).isEqualTo(refreshCookie.getValue());

    }

    @Test
    @DisplayName("로그인 실패")
    void login_fail() throws Exception {
        String loginId = "test12345";
        String password = "!Q2w3e4r5t";
        registerAndApproveEmp(empRepository, empPasswordEncoder, loginId, password);

        InvalidLoginException invalidLoginException = new InvalidLoginException();
        String wrongPassword = "wrongPassword!1234";
        EmpLoginRequest request = new EmpLoginRequest(loginId, wrongPassword);

        mockMvc.perform(
                        post("/api/auth/login")
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(invalidLoginException.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(invalidLoginException.getErrorCode().getMessage()))
                .andExpect(cookie().doesNotExist("refreshToken"))
                .andReturn();

        assertThat(redisTemplate.opsForValue().get("auth:refresh" + loginId)).isNull();
    }




}
