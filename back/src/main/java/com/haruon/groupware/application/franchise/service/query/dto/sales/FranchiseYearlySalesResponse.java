package com.haruon.groupware.application.franchise.service.query.dto.sales;

import java.time.YearMonth;
import java.util.List;

public record FranchiseYearlySalesResponse(
        Long franchiseId,
        String franchiseName,
        Integer salesYear,
        Long totalSalesAmount,
        Long totalOrderCount,
        Long averageSalesAmount,
        Long averageOrderAmount,
        Integer salesMonths,
        List<MonthlySalesPoint> monthlySales
) {

    public FranchiseYearlySalesResponse(
            YearlySalesSummary summary,
            List<MonthlySalesPoint> pointList
    ) {
        this(
                summary.franchiseId, summary.franchiseName, summary.salesYear,
                summary.totalSalesAmount, summary.totalOrderCount, summary.averageSalesAmount,
                summary.averageOrderAmount, summary.salesMonths,
                pointList
        );
    }

    public record MonthlySalesPoint(
            YearMonth salesMonth,
            Long salesAmount,
            Long orderCount
    ) {}

    public record YearlySalesSummary(
            Long franchiseId,
            String franchiseName,
            Integer salesYear,
            Long totalSalesAmount,
            Long totalOrderCount,
            Long averageSalesAmount,            // 연 일평균 매출
            Long averageOrderAmount,            // 연 기준 일평균 거래 건수
            Integer salesMonths                 // 연 중 매출 데이터가 있는 월 수
    ) {}
}
