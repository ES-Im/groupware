package com.haruon.groupware.domain.empInfo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import static com.haruon.groupware.domain.shared.RegexpUtil.PASSWORD_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.PASSWORD_PATTERN_MESSAGE;

@Builder
public record EmpRegisterParam(
        @Size(min = 9, max = 9, message = "사원번호는 9자리(연+월+3자리번호 조합)여야 합니다.")
        String empNo,

        @NotBlank(message = "사원명은 필수 입력값입니다.")
        String empName,

        @NotBlank(message = "아이디는 필수값입니다.")
        String empId,

        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String rawPassword
) {}
