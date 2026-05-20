package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */
@Builder
public record EmpUpdateRequestBySelf (

        String loginId,

        String currentPassword,

        @Nullable
        String extensionNo,

        @Nullable
        String newRawPassword,

        @Nullable
        EmpFileReplaceParam fileRequest,

        @Nullable
        EmpFileStatusChangeParam fileStatusParam
) {

    public EmpUpdateRequestBySelf {
        if(loginId == null || currentPassword == null) throw new RequiredValueMissingException();

        if(currentPassword.isBlank()) throw new BlankValueNotAllowedException();

        if(extensionNo == null && newRawPassword == null && fileRequest == null && fileStatusParam == null) {
            throw new RequiredValueMissingException();
        }

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
        if(newRawPassword != null) RegexpValidator.passwordCheck(newRawPassword);
    }
}
