package com.haruon.groupware.application.auth.required;

/**
 * 로그인/로그아웃/토큰 재발급으로 Redis에 refresh Token을 저장/검사/삭제 하도록 하는 required port
 */
public interface RefreshTokenStore {

    void saveRefreshToken(String refreshToken, String loginId);

    boolean matchesRefreshToken(String loginId, String prevRefreshToken);

    void deleteRefreshToken(String loginId);

}
