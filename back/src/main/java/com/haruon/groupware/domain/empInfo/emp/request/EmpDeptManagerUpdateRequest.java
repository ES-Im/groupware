package com.haruon.groupware.domain.empInfo.emp.request;

import com.haruon.groupware.domain.empInfo.emp.SystemRoleCode;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.Nullable;

/* 권한 : `Emp.SystemRoleCode` = `DEPT_MANAGER`
 *  같은 부서 직원의
 *  제한된 시스템 권한, 내선번호 수정 가능
 */
public record EmpDeptManagerUpdateRequest(

        @Nullable
        SystemRoleCode systemRoleCode,

        @Nullable
        @Pattern(
                regexp="^\\d{3,4}-\\d{4}$",
                message = "내선번호는 `3~4자리 숫자 - 4자리 숫자 형식`이어야 합니다."
        )
        String extensionNo
) {

    public EmpDeptManagerUpdateRequest {
        if (systemRoleCode != null
                && systemRoleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade()) {
            throw new IllegalArgumentException("부서관리자 기준 상위 권한으로 변경할 수 없습니다.");
        }
    }
}
