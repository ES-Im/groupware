package com.haruon.groupware.adapter.webapi.emp.dto.request;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestBySelf;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;

public record EmpUpdateRequest(
        @NotBlank(message = "로그인 ID는 필수입니다.")
        @Pattern(
                regexp = EMP_ID_PATTERN,
                message = EMP_ID_PATTERN_MESSAGE
        )
        @Size(max = 20)
        Long loginId,

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String currentPassword,

        @Pattern(
                regexp = EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo,

        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String newRawPassword

) {

    public EmpUpdateRequestBySelf toEmpUpdateRequestBySelf(
            @AuthenticationPrincipal EmpDetails user
    ) {
        return EmpUpdateRequestBySelf.builder()
                .loginId(user.getUsername())
                .currentPassword(currentPassword)
                .extensionNo(extensionNo)
                .newRawPassword(newRawPassword)
                .build();
    }
}
