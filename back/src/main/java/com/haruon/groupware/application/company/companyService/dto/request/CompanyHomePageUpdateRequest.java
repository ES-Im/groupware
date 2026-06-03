package com.haruon.groupware.application.company.companyService.dto.request;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record CompanyHomePageUpdateRequest(

        @NotBlank
        @Size(max = 200)
        String homePageURL,

        @NotNull
        LocalDateTime editedAt
) {

    public CompanyHomePageUpdateRequest {
        if(homePageURL == null || editedAt == null) throw new RequiredValueMissingException();

        if(homePageURL.isBlank()) throw new BlankValueNotAllowedException();
    }
}
