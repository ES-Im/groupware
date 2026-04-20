package com.haruon.groupware.application.empInfo.deptService;


import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN_MESSAGE;
import static java.util.Objects.requireNonNull;

@Builder
public record DeptRegisterRequest(

        Long adminId,

        @Pattern(
                regexp = DEPT_CODE_PATTERN,
                message = DEPT_CODE_PATTERN_MESSAGE
        )
        String deptCode,

        @Size(max=20)
        String deptName

) {
    public DeptRegisterRequest {
        requireNonNull(adminId, "수정사원번호는 필수값");
        requireNonNull(deptCode, "부서코드는 필수값");
        requireNonNull(deptName, "부서이름은 필수값");
    }
}
