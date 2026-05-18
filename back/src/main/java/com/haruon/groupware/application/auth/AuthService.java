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
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthManagement  {

    private final RefreshTokenStore tokenStoreManagement;
    private final TokenIssuer tokenIssuer;
    private final TokenParser tokenParser;
    private final LoginAuthenticator authenticator;

    @Override
    public void logout(String loginId) {
        tokenStoreManagement.deleteRefreshToken(loginId);
    }

    @Override
    public JwtResponse login(String loginId, String password) {
        AuthenticatedEmp emp = authenticator.authenticate(loginId, password);
        JwtResponse jwtResponse = tokenIssuer.issueToken(emp.loginId(), emp.roles());

        tokenStoreManagement.saveRefreshToken(jwtResponse.refreshToken(), emp.loginId());

        return jwtResponse;
    }

    @Override
    public String reIssue(String refreshToken) {
        if (!tokenParser.isValidToken(refreshToken, false)) {
            throw new PermissionDeniedException();
        }

        String loginId = tokenParser.getLoginId(refreshToken);
        List<String> roles = tokenParser.getRoles(refreshToken);

        if(!tokenStoreManagement.matchesRefreshToken(loginId, refreshToken)) {
            throw new PermissionDeniedException();
        }

        return tokenIssuer.issueAccessToken(loginId, roles);
    }


}
