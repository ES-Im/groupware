package com.haruon.groupware.application.franchise.service.query.dto.sales;

import java.util.List;

public record FranchiseMonthlySalesResponse(
        Long franchiseId,
        String franchiseName,
        Integer salesMonth,
        Long totalSalesAmount,
        Long totalOrderCount,
        Double averageOrderAmount,        // 월 기준 일평균 거래 건수
        Double averageDailySalesAmount,   // 월 기준 일평균 매출
        Integer salesDays,              // 월 중 매출 데이터가 있는 일수
        List<DailySalesPoint> dailySales
) {
    public FranchiseMonthlySalesResponse(
            MonthlySalesSummary summary,
            List<DailySalesPoint> pointList
    ) {
        this(
                summary.franchiseId,
                summary.franchiseName,
                summary.salesMonth,
                summary.totalSalesAmount,
                summary.totalOrderCount,
                summary.averageOrderAmount,
                summary.averageDailySalesAmount,
                summary.salesDays,
                pointList
        );
    }

    public record DailySalesPoint(
            Integer salesDate,
            Long salesAmount,
            Long orderCount
    ) {}

    public record MonthlySalesSummary(
            Long franchiseId,
            String franchiseName,
            Integer salesMonth,
            Long totalSalesAmount,
            Long totalOrderCount,
            Double averageOrderAmount,        // 월 기준 일평균 거래 건수
            Double averageDailySalesAmount,   // 월 기준 일평균 매출
            Integer salesDays
    ) {}
}


