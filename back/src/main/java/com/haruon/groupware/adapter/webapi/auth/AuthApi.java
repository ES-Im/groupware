package com.haruon.groupware.adapter.webapi.auth;

import com.haruon.groupware.adapter.security.JwtCookieManager;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.dto.response.LoginResponse;
import com.haruon.groupware.application.auth.dto.JwtResponse;
import com.haruon.groupware.application.auth.provided.AuthManagement;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApi {

    private final AuthManagement authManagement;
    private final JwtCookieManager jwtCookieManager;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody @Valid EmpLoginRequest request,
            HttpServletResponse response
    ) {
        JwtResponse tokens = authManagement.login(request.loginId(), request.password());
        jwtCookieManager.setRefreshCookie(tokens.refreshToken(), response);

        return ResponseEntity.ok(new LoginResponse(tokens.accessToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal EmpDetails details, HttpServletResponse response
    ) {
        authManagement.logout(details.getUsername());
        jwtCookieManager.deleteRefreshCookie(response);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/reissue")
    public ResponseEntity<String> reissue(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if(refreshToken == null || refreshToken.isBlank()) throw new PermissionDeniedException();
        String accessToken = authManagement.reIssue(refreshToken);

        return ResponseEntity.ok(accessToken);
    }



}
