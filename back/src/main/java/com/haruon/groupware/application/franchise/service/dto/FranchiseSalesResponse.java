package com.haruon.groupware.application.franchise.service.dto;

import java.math.BigDecimal;
import java.time.YearMonth;

public record FranchiseSalesResponse(
        Long franchiseId,
        YearMonth salesMonth,
        BigDecimal totalSalesAmount,
        Long totalOrderCount
) {
}
