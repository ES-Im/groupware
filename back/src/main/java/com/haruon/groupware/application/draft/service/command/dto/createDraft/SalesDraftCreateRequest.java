package com.haruon.groupware.application.draft.service.command.dto.createDraft;

import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

import java.time.YearMonth;

@Builder
public record SalesDraftCreateRequest(

        @NotNull @Valid
        CommonDraftCreateRequest param,

        @NotNull
        Long franchiseId,

        @NotNull
        YearMonth reportMonth,

        @NotNull @Positive
        Long salesAmount

) {
        public SalesDraftCreateRequest {
                if(param == null || franchiseId == null || reportMonth == null || salesAmount == null) {
                        throw new RequiredValueMissingException();
                }

                if(salesAmount < 0) throw new PositiveValueRequiredException();
        }
}
