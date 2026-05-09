package com.haruon.groupware.application.draft.service.dto;

import lombok.Builder;

import java.time.YearMonth;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record SalesDraftCreateRequest(

        CommonDraftCreateRequest param,

        Long franchiseId,

        YearMonth reportMonth,

        Long salesAmount

) {
        public SalesDraftCreateRequest {
                requireNonNull(param);
                requireNonNull(franchiseId);
                requireNonNull(reportMonth);
                requireNonNull(salesAmount);

                state(salesAmount >= 0, "매출총액은 0또는 양수여야함");
        }
}
