package com.haruon.groupware.application.auth;

import com.haruon.groupware.application.auth.dto.AuthenticatedEmp;
import com.haruon.groupware.application.auth.dto.JwtResponse;
import com.haruon.groupware.application.auth.provided.AuthManagement;
import com.haruon.groupware.application.auth.required.LoginAuthenticator;
import com.haruon.groupware.application.auth.required.RefreshTokenStore;
import com.haruon.groupware.application.auth.required.TokenIssuer;
import com.haruon.groupware.application.auth.required.TokenParser;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements AuthManagement  {

    private final RefreshTokenStore tokenStoreManagement;
    private final TokenIssuer tokenIssuer;
    private final TokenParser tokenParser;
    private final LoginAuthenticator authenticator;

    @Override
    public void logout(String loginId) {
        log.info("로그아웃 시작, loginId = {}", loginId);
        tokenStoreManagement.deleteRefreshToken(loginId);
    }

    @Transactional
    @Override
    public JwtResponse login(String loginId, String password) {
        AuthenticatedEmp emp = authenticator.authenticate(loginId, password);
        JwtResponse jwtResponse = tokenIssuer.issueToken(emp.loginId(), emp.roles());
        log.info("jwt 토큰 발급 완료");
        tokenStoreManagement.saveRefreshToken(jwtResponse.refreshToken(), emp.loginId());
        log.info("redis 저장 완료");
        return jwtResponse;
    }

    @Transactional
    @Override
    public String reIssue(String refreshToken) {
        if (!tokenParser.isValidToken(refreshToken, false)) {
            log.info("유효한 리프레쉬 토큰 x");
            throw new PermissionDeniedException();
        }

        String loginId = tokenParser.getLoginId(refreshToken);
        List<String> roles = tokenParser.getRoles(refreshToken);

        log.info("loginId = {}", loginId);
        log.info("roles = {}", roles);

        if(!tokenStoreManagement.matchesRefreshToken(loginId, refreshToken)) {
            log.info("refreshToken이 일치하지 않음");
            throw new PermissionDeniedException();
        }

        return tokenIssuer.issueAccessToken(loginId, roles);
    }

}
