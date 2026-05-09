package com.haruon.groupware.application.empInfo.deptService;


import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record DeptRegisterRequest(

        Long adminId,

        String deptCode,

        String deptName

) {
    public DeptRegisterRequest {
        requireNonNull(adminId, "수정사원번호는 필수값");
        requireNonNull(deptCode, "부서코드는 필수값");
        requireNonNull(deptName, "부서이름은 필수값");

        state(!deptName.isBlank(), "부서명은 공백이 될 수 없음");

        RegexpValidator.deptCodeCheck(deptCode);
    }
}
