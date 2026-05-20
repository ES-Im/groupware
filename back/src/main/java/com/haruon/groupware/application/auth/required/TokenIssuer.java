package com.haruon.groupware.application.auth.required;

import com.haruon.groupware.application.auth.dto.JwtResponse;

import java.util.List;

/**
 * login또는 accessToken을 재발행하는 포트
 */
public interface TokenIssuer {

    // login시 호출
    JwtResponse issueToken(String loginId, List<String> roles);

    // reIssue 시 호출
    String issueAccessToken(String loginId, List<String> roles);

}
