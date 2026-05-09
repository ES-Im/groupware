package com.haruon.groupware;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;
import static org.assertj.core.api.Assertions.assertThat;

public class RegexpTest {

    @Test
    @DisplayName("내선번호는 '3자리숫자-4자리숫자' 형식이다.")
    void validate_extension_regexp() {

        assertThat("123-4567".matches(EXTENSION_NO_PATTERN)).isTrue();
        assertThat("123-456".matches(EXTENSION_NO_PATTERN)).isFalse();
        assertThat("1234567".matches(EXTENSION_NO_PATTERN)).isFalse();
    }

    @Test
    @DisplayName("사원 아이디는는 '아이디는 8자-20자 이하 영어, 숫자' 형식이다.")
    void validate_empId_regexp() {

        assertThat("test1234".matches(EMP_ID_PATTERN)).isTrue();
        assertThat("test12345678901234567890".matches(EMP_ID_PATTERN)).isFalse();
        assertThat("test1".matches(EMP_ID_PATTERN)).isFalse();
    }

    @Test
    @DisplayName("사원 번호는 '9자리[입사연월+3자리번호 조합]' 형식이다.")
    void validate_empNo_regexp() {

        assertThat("202601001".matches(EMP_NO_PATTERN)).isTrue();
        assertThat("2026010001".matches(EMP_NO_PATTERN)).isFalse();
        assertThat("20260100".matches(EMP_NO_PATTERN)).isFalse();
        assertThat("abcdefgfi".matches(EMP_NO_PATTERN)).isFalse();

    }
    
    @Test
    @DisplayName("사원 비밀번호는 '8자이상, 영문+숫자+특수문자 조합'이다.")
    void validate_password_regexp() {
        assertThat("test!1234".matches(PASSWORD_PATTERN)).isTrue();
        assertThat("test1234".matches(PASSWORD_PATTERN)).isFalse();
        assertThat("test12345678901234567890".matches(PASSWORD_PATTERN)).isFalse();
    }

    @Test
    @DisplayName("이메일형식")
    void validate_email() {
        assertThat("test1234@haruon.com".matches(EMAIL_PATTERN)).isTrue();
        assertThat("test1234haruon.com".matches(EMAIL_PATTERN)).isFalse();
        assertThat("test1234@haruon".matches(EMAIL_PATTERN)).isFalse();
        assertThat("test1234@test.com".matches(EMAIL_PATTERN)).isTrue();
    }

    @Test
    @DisplayName("부서코드")
    void validate_dept_code() {
        assertThat("000".matches(DEPT_CODE_PATTERN)).isTrue();
        assertThat("00".matches(DEPT_CODE_PATTERN)).isFalse();
        assertThat("0000".matches(DEPT_CODE_PATTERN)).isFalse();
        assertThat("aaa".matches(DEPT_CODE_PATTERN)).isFalse();
        assertThat("aa*".matches(DEPT_CODE_PATTERN)).isFalse();
        assertThat("aa0".matches(DEPT_CODE_PATTERN)).isFalse();
        assertThat("*a0".matches(DEPT_CODE_PATTERN)).isFalse();
    }

}
