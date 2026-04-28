package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record EmpRegisterRequest(

        String empNo,

        String empName,

        String loginId,

        String rawPassword
) {
        public EmpRegisterRequest {
                requireNonNull(empNo);
                requireNonNull(empName);
                requireNonNull(loginId);
                requireNonNull(rawPassword);

                RegexpValidator.empNoCheck(empNo);
                RegexpValidator.empIdCheck(loginId);
                RegexpValidator.passwordCheck(rawPassword);
                state(!empName.isBlank(), "사원명은 공백이 될 수 없음");
        }
}
