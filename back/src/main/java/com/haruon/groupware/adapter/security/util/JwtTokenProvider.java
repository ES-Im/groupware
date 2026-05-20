package com.haruon.groupware.adapter.security.util;

import com.haruon.groupware.application.auth.dto.JwtResponse;
import com.haruon.groupware.application.auth.required.TokenIssuer;
import com.haruon.groupware.application.auth.required.TokenParser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;


/**
 * accesstoken과 refreshToken을 발행하고,
 * 해당 토큰의 loginId, roles 정보를 조회
 */
@Getter
@Component
public class JwtTokenProvider implements TokenIssuer, TokenParser {

    private final SecretKeySpec secretKey;
    private final Long accessTokenExpiresIn;
    private final Long refreshTokenExpiresIn;

    public JwtTokenProvider(
            @Value("${JWT_SECRET}") String secretStr,
            @Value("${JWT_ACCESS_TOKEN_EXPIRATION_TIME}") Duration accessTokenExpiresIn,
            @Value("${JWT_REFRESH_TOKEN_EXPIRATION_TIME}") Duration refreshTokenExpiresIn
    ) {
        this.secretKey = new SecretKeySpec(
                secretStr.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm()
        );
        this.accessTokenExpiresIn = accessTokenExpiresIn.toMillis();
        this.refreshTokenExpiresIn = refreshTokenExpiresIn.toMillis();
    }

    @Override
    public JwtResponse issueToken(String loginId, List<String> roles) {
        String accessToken = generateAccessToken(loginId, roles);
        String refreshToken = generateRefreshToken(loginId, roles);

        return new JwtResponse(accessToken, refreshToken);
    }

    @Override
    public String issueAccessToken(String loginId, List<String> roles) {
        return generateAccessToken(loginId, roles);
    }

    @Override
    public String getLoginId(String token) {
        return getPayload(token).get("sub", String.class);
    }

    @Override
    public List<String> getRoles(String token) {
        return getPayload(token).get("roles", List.class);
    }

    private Claims getPayload(String token) {
        return Jwts.parser()
                .verifyWith(secretKey).build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String generateAccessToken(
            String loginId,
            List<String> roles
    ) {
        long currentTimeMillis = System.currentTimeMillis();

        Date issuedAt = new Date(currentTimeMillis);
        Date expiresAt = new Date(currentTimeMillis + accessTokenExpiresIn);

        return Jwts.builder()
                .claim("type", "access")
                .subject(loginId)
                .claim("roles", roles)
                .issuedAt(issuedAt)
                .expiration(expiresAt)
                .signWith(secretKey)
                .compact();
    }

    private String generateRefreshToken(
            String loginId,
            List<String> roles
    ) {
        long currentTimeMillis = System.currentTimeMillis();
        Date issuedAt = new Date(currentTimeMillis);
        Date expiresAt = new Date(currentTimeMillis + refreshTokenExpiresIn);

        return Jwts.builder()
                .claim("type", "refresh")
                .subject(loginId)
                .claim("roles", roles)
                .issuedAt(issuedAt)
                .expiration(expiresAt)
                .signWith(secretKey)
                .compact();
    }

    @Override
    public boolean isValidToken(String token, Boolean isAccessToken) {
        try {
            Claims payload = getPayload(token);

            String type = payload.get("type", String.class);

            if(type == null) return false;
            if(isAccessToken && !type.equals("access")) return false;
            if(!isAccessToken && !type.equals("refresh")) return false;

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

}
