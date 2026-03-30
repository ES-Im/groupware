package com.haruon.groupware.domain.shared;

import com.haruon.groupware.domain.empInfo.dto.EmpSelfUpdateParam;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

public class RegexpUtilTest {

    private static final Validator validator = validation();

    private static Validator validation() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }

    private static Stream<Arguments> updateEmpPasswordFailParams() {
        String currentPassword = "!1currentPassword";

        return Stream.of(
                Arguments.of("영문 + 숫자 + 특수문자 조합이 아니라면 실패",
                        EmpSelfUpdateParam.builder()
                                .newRawPassword("Eng123456")
                                .inputPassword(currentPassword)
                                .build()),
                Arguments.of("8자 이상이 아니라면 실패",
                        EmpSelfUpdateParam.builder()
                                .newRawPassword("!Q2w")
                                .inputPassword(currentPassword)
                                .build())
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @DisplayName("패스워드 유효성 검사")
    @MethodSource("updateEmpPasswordFailParams")
    void validate_password_fail(String description, EmpSelfUpdateParam params) {
        var violations = validator.validate(params);

        assertThat(violations).isNotEmpty();
    }


    @Test
    @DisplayName("내선번호 : 000-0000형태가 아니라면 실패")
    void validate_extension_fail() {
        EmpSelfUpdateParam param = EmpSelfUpdateParam.builder()
                .extensionNo("0000000")
                .newRawPassword("Eng123456")
                .build();

        var violations = validator.validate(param);
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("Email 형식 검사 : xxx@도메인 형태가 아니라면 실패")
    void validate_email_fail() {
        var param1 = new Email("aaa@aaa");
        var param2 = new Email("aaa@aaa.aaa");
        var param3 = new Email("aaaaaaaaaa");


        var violations1 = validator.validate(param1);
        var violations2 = validator.validate(param2);
        var violations3 = validator.validate(param3);

        assertThat(violations1).isNotEmpty();
        assertThat(violations2).isNotEmpty();
        assertThat(violations3).isNotEmpty();
    }


}
