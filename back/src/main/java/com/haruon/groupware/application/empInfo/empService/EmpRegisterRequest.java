package com.haruon.groupware.application.empInfo.empService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;

@Builder
public record EmpRegisterRequest(

        @Pattern(
                regexp = EMP_NO_PATTERN,
                message = EMP_NO_PATTERN_MESSAGE
        )
        String empNo,

        @NotBlank(message = "사원명은 필수 입력값입니다.")
        @Size(max = 20)
        String empName,

        @Pattern(
                regexp = EMP_ID_PATTERN,
                message = EMP_ID_PATTERN_MESSAGE
        )
        String loginId,

        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String rawPassword
) {}
