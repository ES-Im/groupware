package com.haruon.groupware.domain.empInfo.emp.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmpRegisterRequest(
        @Size(min = 11, max = 11, message = "사원번호는 11자리여야 합니다.")
        String empNo,

        @NotBlank(message = "사원명은 필수 입력값입니다.")
        String empName,

        @NotBlank(message = "아이디는 필수값입니다.")
        String empId,

        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
                message = "비밀번호는 영문+숫자+특수문자 조합을 해야합니다."
        )
        String rawPassword
) {}
