package com.haruon.groupware.application.empInfo.empService.dto.request;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.Set;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;

@Builder
public record EmpUpdateRequestByHR(

        @Nullable
        @Size(max = 20)
        String empName,

        @Nullable
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String password,

        @Nullable
        @Pattern(
                regexp = EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo,

        @Nullable
        Set<SystemRoleCode> systemRoleCode,

        @Nullable
        LocalDate hireAt

) {

    public EmpUpdateRequestByHR {

        if(systemRoleCode != null
                && (systemRoleCode.isEmpty() || systemRoleCode.stream().anyMatch(roleCode -> roleCode == null))) {
            throw new RequiredValueMissingException();
        }

        if(empName == null
                && password == null
                && extensionNo == null
                && systemRoleCode == null
                && hireAt == null
        ) {
            throw new RequiredValueMissingException();
        }


        if(empName != null && empName.isBlank()) throw new BlankValueNotAllowedException();

        if(password != null) RegexpValidator.passwordCheck(password);

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }

}
