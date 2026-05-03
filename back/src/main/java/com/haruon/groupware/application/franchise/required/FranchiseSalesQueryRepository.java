package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.dto.SalesResult;

import java.time.YearMonth;
import java.util.Optional;

public interface FranchiseSalesQueryRepository {

    Optional<SalesResult> findMonthlySalesByFranchiseId(Long franchiseId, YearMonth yearMonth);

}
