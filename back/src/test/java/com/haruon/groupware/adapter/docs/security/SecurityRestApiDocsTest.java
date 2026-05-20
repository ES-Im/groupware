package com.haruon.groupware.adapter.docs.security;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.JwtCookieManager;
import com.haruon.groupware.adapter.webapi.auth.AuthApi;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.adapter.webapi.exception.GlobalExceptionHandler;
import com.haruon.groupware.adapter.webapi.exception.auth.InvalidLoginException;
import com.haruon.groupware.application.auth.dto.JwtResponse;
import com.haruon.groupware.application.auth.provided.AuthManagement;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.cookies.CookieDocumentation.cookieWithName;
import static org.springframework.restdocs.cookies.CookieDocumentation.responseCookies;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class SecurityRestApiDocsTest extends RestDocsSupport {

    private final AuthManagement authManagement = mock(AuthManagement.class);
    private final JwtCookieManager jwtCookieManager = mock(JwtCookieManager.class);
    private final GlobalExceptionHandler globalExceptionHandler = new GlobalExceptionHandler();

    @Override
    protected Object initController() {
        return new AuthApi(authManagement, jwtCookieManager);
    }

    @Test
    @DisplayName("login 성공 케이스")
    void login_success() throws Exception {
        EmpLoginRequest request = new EmpLoginRequest("test12345", "!Q2w3e4r5t");

        Mockito.when(authManagement.login(anyString(), anyString()))
                .thenReturn(new JwtResponse("accessToken", "refreshToken"));

        Mockito.doAnswer(i -> {
            HttpServletResponse response = i.getArgument(1);
            Cookie cookie = new Cookie("refreshToken", "refreshToken");
            response.addCookie(cookie);

            return null;
        }).when(jwtCookieManager).setRefreshCookie(anyString(), any(HttpServletResponse.class));

        mockMvc.perform(
                post("/api/auth/login")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("LOGIN",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestFields(
                                fieldWithPath("loginId").description("로그인 아이디").attributes(key("constraints").value("-")),
                                fieldWithPath("password").description("비밀번호").attributes(key("constraints").value("-"))
                        ),
                        responseFields(
                                fieldWithPath("accessToken").description("Access Token")
                        ),
                        responseCookies(
                                cookieWithName("refreshToken").description("Refresh Token")
                        )
                ));
    }

    @Test
    @DisplayName("로그인 실패 케이스")
    void login_fail() throws Exception {
        InvalidLoginException invalidLoginException = new InvalidLoginException();

        EmpLoginRequest request = new EmpLoginRequest("test12345", "wrongPassword");

        Mockito.when(authManagement.login(anyString(), anyString()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(
                post("/api/auth/login")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
                ).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(invalidLoginException.getErrorCode().getCode()))
                .andExpect(jsonPath("$.httpStatus").value(401))
                .andExpect(jsonPath("$.message").value(invalidLoginException.getErrorCode().getMessage()))
                .andDo(document("LOGIN_FAIL",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        responseFields(
                                fieldWithPath("code").description("에러 코드"),
                                fieldWithPath("name").description("에러 이름"),
                                fieldWithPath("httpStatus").description("HTTP 상태 코드"),
                                fieldWithPath("message").description("에러 메시지")
                        )
                ));
    }
}
