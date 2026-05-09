package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

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
        requireNonNull(businessNumber);
        requireNonNull(franchiseName);
        requireNonNull(address);
        requireNonNull(ownerName);
        requireNonNull(contactNumber);
        requireNonNull(contactEmail);

        RegexpValidator.businessNumberCheck(businessNumber);
        RegexpValidator.contactNumberCheck(contactNumber);
        RegexpValidator.emailCheck(contactEmail);

        state(!franchiseName.isBlank(), "가맹점명은 공백이 될 수 없음");
        state(!address.isBlank(), "가맹점주소는 공백이 될 수 없음");
        state(!ownerName.isBlank(), "가맹점주 이름은 공백이 될 수 없음");
    }
}
