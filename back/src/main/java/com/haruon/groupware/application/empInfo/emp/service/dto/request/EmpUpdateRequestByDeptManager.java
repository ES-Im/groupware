package com.haruon.groupware.application.empInfo.emp.service.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.Set;

@Builder
public record EmpUpdateRequestByDeptManager (

        @Nullable
        Set<SystemRoleCode> systemRoleCode,

        @Nullable
        String extensionNo

) {

    public EmpUpdateRequestByDeptManager {

        if(systemRoleCode == null && extensionNo == null) throw new RequiredValueMissingException();

        if(systemRoleCode != null
                && (systemRoleCode.isEmpty() || systemRoleCode.stream().anyMatch(roleCode -> roleCode == null))) {
            throw new RequiredValueMissingException();
        }

        if (systemRoleCode != null && systemRoleCode.stream()
                .anyMatch(roleCode -> roleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade())) {
            throw new PermissionDeniedException();
        }

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }
}
