package com.haruon.groupware.application.auth.provided;

import com.haruon.groupware.application.auth.dto.JwtResponse;

public interface AuthManagement {
    void logout(String loginId);
    JwtResponse login(String loginId, String password);
    String reIssue(String refreshToken);
}
