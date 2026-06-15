package com.haruon.groupware.application.franchise.service.query.dto.sales;

import java.time.LocalDate;

public record FranchiseDailySalesResponse(
        Long franchiseId,
        String franchiseName,
        LocalDate salesDate,
        Long salesAmount,
        Long orderCount
) {}
