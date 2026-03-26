package com.haruon.groupware.domain.empInfo.emp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;
import static org.springframework.util.Assert.state;

/*
 * `Emp.SystemRoleCode` = `EMPLOYEE`
 * - 본인의 내선번호, 비밀번호
 */
@Builder
public record EmpSelfUpdateParam(
        @NotBlank
        String inputPassword,

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
        EmpFileParam fileRequest
) {

    public EmpSelfUpdateParam {
        state(extensionNo != null || newRawPassword != null || fileRequest != null, "변경된 정보가 없습니다.");
    }
}
