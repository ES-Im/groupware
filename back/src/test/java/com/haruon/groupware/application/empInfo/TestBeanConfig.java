package com.haruon.groupware.application.empInfo;

import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.Locale;

@TestConfiguration
public class TestBeanConfig {

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(String rawPassword) {
                return rawPassword.toUpperCase(Locale.ROOT);
            }

            @Override
            public boolean matches(String rawPassword, String encodedPassword) {
                return rawPassword.toUpperCase(Locale.ROOT).equals(encodedPassword);
            }
        };
    }

}
