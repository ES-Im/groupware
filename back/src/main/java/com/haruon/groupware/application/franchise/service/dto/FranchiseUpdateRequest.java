package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record FranchiseUpdateRequest(

        @Nullable
        String businessNumber,

        @Nullable
        String franchiseName,

        @Nullable
        String address,

        @Nullable
        String ownerName,

        @Nullable
        String contactNumber,

        @Nullable
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
