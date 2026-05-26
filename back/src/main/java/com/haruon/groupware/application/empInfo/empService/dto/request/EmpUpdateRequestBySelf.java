package com.haruon.groupware.application.empInfo.empService.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */
@Builder
public record EmpUpdateRequestBySelf (

        @Nullable
        @Pattern(
                regexp = EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo,

        @Nullable
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String newRawPassword

) {

    public EmpUpdateRequestBySelf {

        if(extensionNo == null && newRawPassword == null) {
            throw new RequiredValueMissingException();
        }

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
        if(newRawPassword != null) RegexpValidator.passwordCheck(newRawPassword);
    }

}
