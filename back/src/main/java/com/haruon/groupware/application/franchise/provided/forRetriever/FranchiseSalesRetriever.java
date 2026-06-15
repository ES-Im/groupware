package com.haruon.groupware.application.franchise.provided.forRetriever;

import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Optional;

/**
 * 프랜차이즈 가맹점별 매출현황을 제공
 */
public interface FranchiseSalesRetriever {
    Optional<FranchiseYearlySalesResponse> retrieveFranchiseYearlySales(Long empId, Long franchiseId, Year year);

    Optional<FranchiseMonthlySalesResponse> retrieveFranchiseMonthlySales(Long empId, Long franchiseId, YearMonth yearMonth);

    Optional<FranchiseDailySalesResponse> retrieveFranchiseDailySales(Long empId, Long franchiseId, LocalDate date);
}
