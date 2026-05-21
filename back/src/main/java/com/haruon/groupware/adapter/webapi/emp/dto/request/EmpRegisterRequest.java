package com.haruon.groupware.adapter.webapi.emp.dto.request;

import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequestBySelf;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;

public record EmpRegisterRequest(

        @NotBlank(message = "사원번호는 필수입니다.")
        @Pattern(
                regexp = EMP_NO_PATTERN,
                message = EMP_NO_PATTERN_MESSAGE
        )
        String empNo,

        @Size(max = 20)
        @NotBlank(message = "사원명은 필수입니다.")
        String name,

        @NotBlank(message = "로그인 ID는 필수입니다.")
        @Pattern(
                regexp = EMP_ID_PATTERN,
                message = EMP_ID_PATTERN_MESSAGE
        )
        @Size(max = 20)
        String loginId,

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String password

) {

    public EmpRegisterRequestBySelf toRequestBySelf() {
        return new EmpRegisterRequestBySelf(empNo, name, loginId, password);
    }
}