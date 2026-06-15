package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Optional;

public interface FranchiseSalesQueryRepository {

    Optional<FranchiseYearlySalesResponse> findYearlySalesById(Long franchiseId, Year year);

    Optional<FranchiseMonthlySalesResponse> findMonthlySalesById(Long franchiseId, YearMonth yearMonth);

    Optional<FranchiseDailySalesResponse> findDailySalesById(Long franchiseId, LocalDate date);
}
