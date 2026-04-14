package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.Positive;

import java.time.YearMonth;

public record SalesDraftCreateRequest(

        CommonDraftCreateRequest param,

        long franchiseId,

        YearMonth reportMonth,

        @Positive
        long salesAmount

) {

}
