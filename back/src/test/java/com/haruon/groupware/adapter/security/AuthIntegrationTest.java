package com.haruon.groupware.adapter.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.adapter.webapi.exception.auth.InvalidLoginException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import jakarta.servlet.http.Cookie;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static com.haruon.groupware.adapter.IntegrityTestFixtures.getAccessToken;
import static com.haruon.groupware.adapter.IntegrityTestFixtures.registerAndApproveEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
public class AuthIntegrationTest extends IntegrationTestSupport {

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
                .get(REFRESH_TOKEN_KEY_PREFIX + request.loginId());

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

        assertThat(redisTemplate.opsForValue().get(REFRESH_TOKEN_KEY_PREFIX + loginId)).isNull();
    }

    @Test
    @DisplayName("로그아웃 성공")
    void logout_success() throws Exception {
        String accessToken = getAccessToken(
                empRepository, empPasswordEncoder, mockMvc, objectMapper, "test12345", "!Q2w3e4r5t"
        );

        mockMvc.perform(
                        post("/api/auth/logout")
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().value("refreshToken", ""))
                .andExpect(cookie().maxAge("refreshToken", 0));


        assertThat(redisTemplate.opsForValue()
                                .get(REFRESH_TOKEN_KEY_PREFIX + tokenParser.getLoginId(accessToken))
        ).isNull();
    }

    @Test
    @DisplayName("로그아웃 실패 - 비정상적인 access token이 전달되면 실패")
    void logout_fail() throws Exception {
        mockMvc.perform(
                        post("/api/auth/logout")
                                .header("Authorization", "Bearer " + "wrong token")
                )
                .andExpect(status().isUnauthorized());

//        log.info("actions = {}", actions.andReturn().getResponse().getClass());
    }
    
    @Test
    @DisplayName("accessToken - refresh 성공")
    void refresh_success() throws Exception{
        String accessToken = getAccessToken(
                empRepository, empPasswordEncoder, mockMvc, objectMapper, "test12345", "!Q2w3e4r5t"
        );

        String refreshToken = redisTemplate.opsForValue().get(REFRESH_TOKEN_KEY_PREFIX + "test12345");

        MvcResult result = mockMvc.perform(
                        post("/api/auth/reissue")
                                .cookie(new Cookie("refreshToken", refreshToken))
                )
                .andExpect(status().isOk())
                .andReturn();

        String contentAsString = result.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(contentAsString);
        
        log.info("jsonNode = {}", jsonNode);

        assertFalse(jsonNode.get("accessToken").equals(accessToken));
    }

    @Test
    @DisplayName("accessToken - refresh 실패")
    void refresh_fail() throws Exception{
        PermissionDeniedException permissionDeniedException = new PermissionDeniedException();

        mockMvc.perform(
                        post("/api/auth/reissue")
                                .cookie(new Cookie("refreshToken", "wrongToken"))
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(permissionDeniedException.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(permissionDeniedException.getErrorCode().getMessage()))
                .andReturn();
    }


}
