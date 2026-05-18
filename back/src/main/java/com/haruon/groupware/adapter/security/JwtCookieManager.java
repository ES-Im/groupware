package com.haruon.groupware.adapter.security;

import com.haruon.groupware.adapter.security.util.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtCookieManager {

    private final JwtTokenProvider jwtTokenProvider;

    public void setRefreshCookie(String refreshToken, HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);

        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(jwtTokenProvider.getRefreshTokenExpiresIn().intValue() / 1000);
        cookie.setSecure(false);    //todo HTTPS 환경에서 true로 변경 필요

        response.addCookie(cookie);
    }

    public void deleteRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");

        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }
}
