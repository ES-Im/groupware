package com.haruon.groupware.application.empInfo.deptService;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN_MESSAGE;
import static java.util.Objects.requireNonNull;

public record DeptRegisterRequest(

        @NotNull
        @Pattern(
                regexp = DEPT_CODE_PATTERN,
                message = DEPT_CODE_PATTERN_MESSAGE
        )
        String deptCode,

        @NotNull
        @Size(max=20)
        String deptName
) {
    public DeptRegisterRequest {
        requireNonNull(deptCode, "부서코드는 필수값");
        requireNonNull(deptName, "부서이름은 필수값");
    }
}
