package com.haruon.groupware.application.franchise.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN_MESSAGE;

@Builder
public record FranchiseUpdateRequest(

        @Nullable
        @Size(max = 12, min = 12)
        String businessNumber,

        @Nullable
        @Size(max = 50)
        String franchiseName,

        @Nullable
        @Size(max = 200)
        String address,

        @Nullable
        @Size(max = 50)
        String ownerName,

        @Nullable
        @Size(max = 50)
        String contactNumber,

        @Nullable
        @Pattern(
                regexp = EMAIL_PATTERN,
                message = EMAIL_PATTERN_MESSAGE
        )
        String contactEmail
) {

    public FranchiseUpdateRequest {
        if(businessNumber == null && franchiseName == null && address == null && ownerName == null && contactNumber == null && contactEmail == null) {
            throw new RequiredValueMissingException();
        }

        if(franchiseName != null) if(franchiseName.isBlank()) throw new BlankValueNotAllowedException();
        if(address != null) if(address.isBlank()) throw new BlankValueNotAllowedException();
        if(ownerName != null) if(ownerName.isBlank()) throw new BlankValueNotAllowedException();

        if(businessNumber != null) RegexpValidator.businessNumberCheck(businessNumber);
        if(contactNumber != null) RegexpValidator.contactNumberCheck(contactNumber);
        if(contactEmail != null) RegexpValidator.emailCheck(contactEmail);
    }
}
