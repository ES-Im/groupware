package com.haruon.groupware.adapter.security;

import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import org.springframework.stereotype.Component;

// to-do 패스워드 인코더 구현
@Component
public class SecurePasswordEncoder implements PasswordEncoder {

    @Override
    public String encode(String rawPassword) {
        return "";
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return false;
    }
    
}
