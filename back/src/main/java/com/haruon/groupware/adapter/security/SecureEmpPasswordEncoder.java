package com.haruon.groupware.adapter.security;

import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecureEmpPasswordEncoder implements EmpPasswordEncoder {

    private final PasswordEncoder encoder;

    @Override
    @NullMarked
    public String encode(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    @Override
    @NullMarked
    public boolean matches(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }
    
}
