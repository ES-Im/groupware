package com.haruon.groupware.domain.employee;

public interface EmpPasswordEncoder {
    String encode(String rawPassword);
    boolean matches(String rawPassword, String encodedPassword);
}
