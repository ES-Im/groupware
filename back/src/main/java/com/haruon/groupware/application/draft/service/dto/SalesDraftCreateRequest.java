package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.YearMonth;

@Builder
public record SalesDraftCreateRequest(

        CommonDraftCreateRequest param,

        Long franchiseId,

        YearMonth reportMonth,

        Long salesAmount

) {
        public SalesDraftCreateRequest {
                if(param == null || franchiseId == null || reportMonth == null || salesAmount == null) {
                        throw new RequiredValueMissingException();
                }

                if(salesAmount < 0) throw new PositiveValueRequiredException();
        }
}
