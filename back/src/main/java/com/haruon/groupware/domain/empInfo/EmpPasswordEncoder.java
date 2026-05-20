package com.haruon.groupware.domain.empInfo;

public interface EmpPasswordEncoder {
    String encode(String rawPassword);
    boolean matches(String rawPassword, String encodedPassword);
}
