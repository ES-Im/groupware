package com.haruon.groupware.application.franchise.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN_MESSAGE;

@Builder
public record FranchiseCreateRequest(

        @NotBlank
        @Size(max = 12, min = 12)
        String businessNumber,

        @NotBlank
        @Size(max = 50)
        String franchiseName,

        @NotBlank
        @Size(max = 200)
        String address,

        @NotBlank
        @Size(max = 50)
        String ownerName,

        @NotBlank
        @Size(max = 50)
        String contactNumber,

        @Pattern(
                regexp = EMAIL_PATTERN,
                message = EMAIL_PATTERN_MESSAGE
        )
        String contactEmail,

        @Nullable
        Long managerEmpId
) {

    public FranchiseCreateRequest {
        if(businessNumber == null || franchiseName == null || address == null || ownerName == null || contactNumber == null || contactEmail == null) throw new RequiredValueMissingException();
        if(franchiseName.isBlank() || address.isBlank() || ownerName.isBlank()) throw new BlankValueNotAllowedException();

        RegexpValidator.businessNumberCheck(businessNumber);
        RegexpValidator.contactNumberCheck(contactNumber);
        RegexpValidator.emailCheck(contactEmail);
    }
}
