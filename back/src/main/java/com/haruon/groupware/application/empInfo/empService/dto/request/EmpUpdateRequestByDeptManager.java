package com.haruon.groupware.application.empInfo.empService.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/* 권한 : `Emp.SystemRoleCode` = `DEPT_MANAGER`
 *  같은 부서 직원의
 *  제한된 시스템 권한, 내선번호 수정 가능
 */
@Builder
public record EmpUpdateRequestByDeptManager (

        Long targetEmpId,

        @Nullable
        SystemRoleCode systemRoleCode,

        @Nullable
        String extensionNo

) {

    public EmpUpdateRequestByDeptManager {
        if(targetEmpId == null) throw new RequiredValueMissingException();

        if(systemRoleCode == null && extensionNo == null) throw new RequiredValueMissingException();

        if (systemRoleCode != null
                && systemRoleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade()) {
            throw new PermissionDeniedException();
        }

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }
}
