package com.haruon.groupware.application.auth.required;

import java.util.List;

/**
 * jwt 토큰 내 정보를 추출
 */
public interface TokenParser {
    String getLoginId(String token);

    List<String> getRoles(String token);

    boolean isValidToken(String token, Boolean isAccessToken);
}
