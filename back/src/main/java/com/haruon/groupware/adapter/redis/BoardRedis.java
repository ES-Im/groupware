package com.haruon.groupware.adapter.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoardRedis {

    //todo - BoardReactionCounter 관련 증감 처리 및 일정시각에 DB에 적용하는 배치 처리 필요
    private static final String BOARD_PREFIX = "board:";

    private final StringRedisTemplate redisTemplate;
}
