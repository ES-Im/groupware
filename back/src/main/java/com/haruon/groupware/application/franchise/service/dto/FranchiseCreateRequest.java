package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record FranchiseCreateRequest(

        String businessNumber,

        String franchiseName,

        String address,

        String ownerName,

        String contactNumber,

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
