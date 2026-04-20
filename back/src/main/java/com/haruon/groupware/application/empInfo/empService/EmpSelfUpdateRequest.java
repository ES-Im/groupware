package com.haruon.groupware.application.empInfo.empService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */
@Builder
public record EmpSelfUpdateRequest(

        Long empId,

        @NotBlank
        String currentPassword,

        @Nullable
        @Pattern(
                regexp=EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo,

        @Nullable
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String newRawPassword,

        @Nullable
        EmpFileReplaceParam fileRequest,

        @Nullable
        EmpFileStatusChangeParam fileStatusParam
) {

    public EmpSelfUpdateRequest {
        requireNonNull(empId, "사원의 targetEmpId(PK) 필수");
        requireNonNull(currentPassword);
        state(extensionNo != null
                || newRawPassword != null
                || fileRequest != null
                || fileStatusParam != null
                , "변경된 정보가 없습니다.");
    }
}
