package com.haruon.groupware.application.dept.deptService.dto.request;


import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.DEPT_CODE_PATTERN_MESSAGE;

@Builder
public record DeptRegisterRequest(

        @NotNull
        @Pattern(
                regexp = DEPT_CODE_PATTERN,
                message = DEPT_CODE_PATTERN_MESSAGE
        )
        String deptCode,

        @NotBlank
        @Size(max = 20)
        String deptName

) {
    public DeptRegisterRequest {
        if(deptCode == null || deptName == null) {
            throw new RequiredValueMissingException();
        }

        if(deptCode.isBlank()) throw new BlankValueNotAllowedException();

        RegexpValidator.deptCodeCheck(deptCode);
    }
}
