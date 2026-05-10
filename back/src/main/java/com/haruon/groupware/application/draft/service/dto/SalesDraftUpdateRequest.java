package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.YearMonth;

@Builder
public record SalesDraftUpdateRequest(

        CommonDraftUpdateRequest param,

        @Nullable
        Long franchiseId,

        @Nullable
        YearMonth reportMonth,

        @Nullable
        Long salesAmount

) {
        public SalesDraftUpdateRequest {
                if(param == null || (
                        franchiseId == null && reportMonth == null && salesAmount == null
                )) {
                        throw new RequiredValueMissingException();
                }

                if(salesAmount != null && salesAmount < 0) throw new PositiveValueRequiredException();
        }
}
