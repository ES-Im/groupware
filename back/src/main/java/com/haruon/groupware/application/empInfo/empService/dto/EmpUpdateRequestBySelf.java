package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */
@Builder
public record EmpUpdateRequestBySelf (

        Long empId,

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
        requireNonNull(empId, "사원의 targetEmpId(PK) 필수");
        requireNonNull(currentPassword);
        state(!currentPassword.isBlank(), "현재 비밀번호는 공백이 될 수 없음");

        state(extensionNo != null
                || newRawPassword != null
                || fileRequest != null
                || fileStatusParam != null
                , "변경된 정보가 없습니다.");

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
        if(newRawPassword != null) RegexpValidator.passwordCheck(newRawPassword);
    }
}
