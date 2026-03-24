package com.haruon.groupware.domain.empInfo.emp.dto;

import com.haruon.groupware.domain.empInfo.emp.SystemRoleCode;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.EXTENSION_NO_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EXTENSION_NO_PATTERN_MESSAGE;
import static org.springframework.util.Assert.state;

/* 권한 : `Emp.SystemRoleCode` = `DEPT_MANAGER`
 *  같은 부서 직원의
 *  제한된 시스템 권한, 내선번호 수정 가능
 */
@Builder
public record EmpDeptManagerUpdateParam(

        @Nullable
        SystemRoleCode systemRoleCode,

        @Nullable
        @Pattern(
                regexp=EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo

) {

    public EmpDeptManagerUpdateParam {
        state(systemRoleCode != null || extensionNo != null, "변경된 정보가 없습니다.");

        if (systemRoleCode != null
                && systemRoleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade()) {
            throw new IllegalArgumentException("부서관리자 기준 상위 권한으로 변경할 수 없습니다.");
        }
    }
}
