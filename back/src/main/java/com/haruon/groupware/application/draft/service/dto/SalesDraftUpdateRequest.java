package com.haruon.groupware.application.draft.service.dto;

import org.jspecify.annotations.Nullable;

import java.time.YearMonth;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

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
                requireNonNull(param, "기안서 기본 정보 필수");
                state(param.isChangeCommonField() ||
                        franchiseId != null ||
                        reportMonth != null ||
                        salesAmount != null,
                        "변경내용이 없음");

                if(salesAmount != null) state(salesAmount >= 0, "매출총액은 0또는 양수여야 함");
        }
}
