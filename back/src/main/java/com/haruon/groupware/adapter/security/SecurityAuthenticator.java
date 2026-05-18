package com.haruon.groupware.adapter.security;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.auth.dto.AuthenticatedEmp;
import com.haruon.groupware.application.auth.required.LoginAuthenticator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityAuthenticator implements LoginAuthenticator {

    private final AuthenticationManager authenticationManager;

    @Override
    public AuthenticatedEmp authenticate(String loginId, String rawPassword) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginId, rawPassword)
        );

        EmpDetails empDetails = (EmpDetails) authentication.getPrincipal();

        return new AuthenticatedEmp(
                empDetails.getUsername(),
                empDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList()
        );
    }
}
