package com.haruon.groupware.application.franchise.service.query;

import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseSalesRetriever;
import com.haruon.groupware.application.franchise.required.FranchiseSalesQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FranchiseSalesQueryService implements FranchiseSalesRetriever {

    private final FranchiseSalesQueryRepository franchiseSalesQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;


    @Override
    public Optional<FranchiseYearlySalesResponse> retrieveFranchiseYearlySales(
            Long empId, Long franchiseId, Year year
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseSalesQueryRepository.findYearlySalesById(
                franchiseId, year
        );
    }

    @Override
    public Optional<FranchiseMonthlySalesResponse> retrieveFranchiseMonthlySales(
            Long empId, Long franchiseId, YearMonth yearMonth
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseSalesQueryRepository.findMonthlySalesById(
                franchiseId, yearMonth
        );
    }

    @Override
    public Optional<FranchiseDailySalesResponse> retrieveFranchiseDailySales(
            Long empId, Long franchiseId, LocalDate date
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseSalesQueryRepository.findDailySalesById(
                franchiseId, date
        );
    }
}
