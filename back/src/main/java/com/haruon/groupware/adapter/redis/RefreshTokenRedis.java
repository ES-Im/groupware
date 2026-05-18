package com.haruon.groupware.adapter.redis;

import com.haruon.groupware.application.auth.required.RefreshTokenStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenRedis implements RefreshTokenStore {

    private static final String REFRESH_KEY_PREFIX = "auth:refresh:";

    private final StringRedisTemplate redisTemplate;

    @Value("${JWT_REFRESH_TOKEN_EXPIRATION_TIME}") Duration refreshTokenExpiresIn;

    @Override
    public void saveRefreshToken(
            String refreshToken,
            String loginId
    ) {
        redisTemplate.opsForValue().set(
                key(loginId),
                refreshToken,
                refreshTokenExpiresIn
        );
    }

    @Override
    public boolean matchesRefreshToken(String loginId, String prevRefreshToken) {
        String stored = redisTemplate.opsForValue().get(key(loginId));

        return stored != null && stored.equals(prevRefreshToken);
    }

    @Override
    public void deleteRefreshToken(String loginId) {
        redisTemplate.delete(key(loginId));
    }

    private String key(String loginId) {
        return REFRESH_KEY_PREFIX + loginId;
    }

}
