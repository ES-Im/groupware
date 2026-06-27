package com.haruon.groupware.application.company.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record CompanyRegisterRequest(

        @NotBlank
        @Size(max = 50)
        String companyName,

        @NotBlank
        @Size(max = 200)
        String location,

        @NotBlank
        @Email
        @Size(max = 150)
        String presentedEmail,

        @NotBlank
        @Size(max = 20)
        String presentedExternalNo,

        @NotBlank
        @Size(max = 20)
        String ownerName,

        @NotBlank
        @Size(max = 200)
        String homePageURL,

        @NotNull
        LocalDateTime editedAt
) {

    public CompanyRegisterRequest {
        if(companyName == null || location == null || presentedEmail == null
                || presentedExternalNo == null || ownerName == null || homePageURL == null || editedAt == null) {
            throw new RequiredValueMissingException();
        }

        if(companyName.isBlank() || location.isBlank() || presentedExternalNo.isBlank()
                || ownerName.isBlank() || homePageURL.isBlank()) {
            throw new BlankValueNotAllowedException();
        }

        RegexpValidator.emailCheck(presentedEmail);
    }
}
