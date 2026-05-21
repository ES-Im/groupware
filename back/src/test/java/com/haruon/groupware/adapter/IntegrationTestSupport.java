package com.haruon.groupware.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.redis.RefreshTokenRedis;
import com.haruon.groupware.adapter.security.JwtCookieManager;
import com.haruon.groupware.application.auth.provided.AuthManagement;
import com.haruon.groupware.application.auth.required.TokenParser;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class IntegrationTestSupport {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected StringRedisTemplate redisTemplate;
    @Autowired protected AuthManagement authManagement;
    @Autowired protected JwtCookieManager jwtCookieManager;
    @Autowired protected RefreshTokenRedis refreshTokenRedis;
    @Autowired protected EmpAccountManager empAccountManager;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected EmpPasswordEncoder empPasswordEncoder;
    @Autowired protected TokenParser tokenParser;
    @Autowired protected EmpPasswordEncoder encoder;

    @Autowired protected DeptRepository deptRepository;
    @Autowired protected EmpRepository empRepository;

    @AfterEach
    void tearDown() {
        empRepository.deleteAll();
        deptRepository.deleteAll();
        redisTemplate.delete("auth:refresh:test12345");
    }

    protected static final String REFRESH_TOKEN_KEY_PREFIX = "auth:refresh:";

}
