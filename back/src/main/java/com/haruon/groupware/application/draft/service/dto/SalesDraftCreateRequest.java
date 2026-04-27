package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.Positive;
import lombok.Builder;

import java.time.YearMonth;

@Builder
public record SalesDraftCreateRequest(

        CommonDraftCreateRequest param,

        long franchiseId,

        YearMonth reportMonth,

        @Positive
        long salesAmount

) {

}
