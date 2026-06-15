package com.haruon.groupware.application.franchise.service.query.dto.sales;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public record FranchiseMonthlySalesResponse(
        Long franchiseId,
        String franchiseName,
        YearMonth salesMonth,
        Long totalSalesAmount,
        Long totalOrderCount,
        Long averageOrderAmount,        // 월 기준 일평균 거래 건수
        Long averageDailySalesAmount,   // 월 기준 일평균 매출
        Integer salesDays,              // 월 중 매출 데이터가 있는 일수
        List<DailySalesPoint> dailySales
) {
    public record DailySalesPoint(
            LocalDate salesDate,
            Long salesAmount,
            Long orderCount
    ) {}
}


