package com.haruon.groupware.domain.empInfo.emp.request;

import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.Nullable;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */

public record EmpSelfUpdateRequest(
        @Nullable
        @Pattern(
                regexp= "^\\d{3,4}-\\d{4}$",
                message = "내선번호는 `3~4자리 숫자 - 4자리 숫자 형식`이어야 합니다."
        )
        String extensionNo,

        @Nullable
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
                message = "비밀번호는 영문+숫자+특수문자 조합을 해야합니다."
        )
        String rawPassword

) {
}
