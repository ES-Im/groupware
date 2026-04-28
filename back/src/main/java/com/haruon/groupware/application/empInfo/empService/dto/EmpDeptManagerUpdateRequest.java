package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/* 권한 : `Emp.SystemRoleCode` = `DEPT_MANAGER`
 *  같은 부서 직원의
 *  제한된 시스템 권한, 내선번호 수정 가능
 */
@Builder
public record EmpDeptManagerUpdateRequest(

        Long targetEmpId,

        Long deptManagerId,

        @Nullable
        SystemRoleCode systemRoleCode,

        @Nullable
        String extensionNo

) {

    public EmpDeptManagerUpdateRequest {
        requireNonNull(deptManagerId, "부서매니저 사원 ID 필수");
        requireNonNull(targetEmpId, "수정대상 사원 ID 필수");
        state(systemRoleCode != null || extensionNo != null, "변경된 정보가 없습니다.");

        if (systemRoleCode != null
                && systemRoleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade()) {
            throw new IllegalArgumentException("부서관리자 기준 상위 권한으로 변경할 수 없습니다.");
        }

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }
}
