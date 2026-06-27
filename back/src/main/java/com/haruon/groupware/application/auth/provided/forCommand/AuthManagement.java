package com.haruon.groupware.application.auth.provided.forCommand;

import com.haruon.groupware.application.auth.service.command.dto.JwtResponse;

public interface AuthManagement {
    void logout(String loginId);
    JwtResponse login(String loginId, String password);
    String reIssue(String refreshToken);

}
