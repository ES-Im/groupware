package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static org.springframework.util.Assert.state;

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
        state(businessNumber != null
                        || franchiseName != null
                        || address != null
                        || ownerName != null
                        || contactNumber != null
                        || contactEmail != null,
                "변경할 정보가 없음");

        if(franchiseName != null) state(!franchiseName.isBlank(), "가맹점명은 공백이 될 수 없음");
        if(address != null) state(!address.isBlank(), "가맹점주소는 공백이 될 수 없음");
        if(ownerName != null) state(!ownerName.isBlank(), "가맹점주 이름은 공백이 될 수 없음");
        if(businessNumber != null) RegexpValidator.businessNumberCheck(businessNumber);
        if(contactNumber != null) RegexpValidator.contactNumberCheck(contactNumber);
        if(contactEmail != null) RegexpValidator.emailCheck(contactEmail);
    }
}
