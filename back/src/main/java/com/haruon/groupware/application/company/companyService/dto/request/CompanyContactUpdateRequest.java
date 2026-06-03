package com.haruon.groupware.application.company.companyService.dto.request;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record CompanyContactUpdateRequest(

        @Nullable
        @Email
        @Size(max = 150)
        String presentedEmail,

        @Nullable
        @Size(max = 20)
        String presentedExternalNo,

        @NotNull
        LocalDateTime editedAt
) {

    public CompanyContactUpdateRequest {
        if(editedAt == null) throw new RequiredValueMissingException();

        if(presentedEmail == null && presentedExternalNo == null) {
            throw new RequiredValueMissingException();
        }

        if(presentedExternalNo != null) if(presentedExternalNo.isBlank()) throw new BlankValueNotAllowedException();
        if(presentedEmail != null) RegexpValidator.emailCheck(presentedEmail);
    }
}
