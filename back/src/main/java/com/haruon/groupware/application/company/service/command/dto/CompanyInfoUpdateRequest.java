package com.haruon.groupware.application.company.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record CompanyInfoUpdateRequest(

        @Nullable
        @Size(max = 50)
        String companyName,

        @Nullable
        @Size(max = 200)
        String location,

        @Nullable
        @Size(max = 20)
        String ownerName,

        @NotNull
        LocalDateTime editedAt
) {

    public CompanyInfoUpdateRequest {
        if(editedAt == null) throw new RequiredValueMissingException();

        if(companyName == null && location == null && ownerName == null) {
            throw new RequiredValueMissingException();
        }

        if(companyName != null) if(companyName.isBlank()) throw new BlankValueNotAllowedException();
        if(location != null) if(location.isBlank()) throw new BlankValueNotAllowedException();
        if(ownerName != null) if(ownerName.isBlank()) throw new BlankValueNotAllowedException();
    }
}
