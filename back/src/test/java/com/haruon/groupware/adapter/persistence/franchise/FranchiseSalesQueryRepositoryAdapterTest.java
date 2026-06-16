package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.franchise.required.FranchiseDailySalesRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.required.FranchiseSalesQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseDailySales;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
record FranchiseSalesQueryRepositoryAdapterTest(
        FranchiseSalesQueryRepository salesQueryRepository,
        FranchiseDailySalesRepository dailySalesRepository,
        FranchiseRepository franchiseRepository
) {

    @AfterEach
    void tearDown() {
        dailySalesRepository.deleteAll();
        franchiseRepository.deleteAll();
    }

    @Test
    @DisplayName("일 매출 조회 - 지정한 가맹점과 일자의 매출을 조회한다")
    void findDailySalesById_success() {
        Franchise franchise = saveFranchise();
        LocalDate salesDate = LocalDate.of(2026, 4, 1);
        saveSales(franchise, salesDate, 1_000_000L, 100L);

        Optional<FranchiseDailySalesResponse> response = salesQueryRepository.findDailySalesById(
                franchise.getId(), salesDate
        );

        assertThat(response).contains(
                new FranchiseDailySalesResponse(
                        franchise.getId(),
                        franchise.getFranchiseName(),
                        salesDate,
                        1_000_000L,
                        100L
                )
        );
    }

    @Test
    @DisplayName("연 매출 조회 - 연 요약과 월별 매출 포인트를 조회한다")
    void findYearlySalesById_success() {
        Franchise franchise = saveFranchise();
        Franchise otherFranchise = saveFranchise();

        saveSales(franchise, LocalDate.of(2026, 1, 1), 1_000L, 10L);
        saveSales(franchise, LocalDate.of(2026, 1, 2), 2_000L, 20L);
        saveSales(franchise, LocalDate.of(2026, 2, 1), 3_000L, 30L);
        saveSales(franchise, LocalDate.of(2025, 12, 31), 9_000L, 90L);
        saveSales(otherFranchise, LocalDate.of(2026, 1, 1), 8_000L, 80L);

        Optional<FranchiseYearlySalesResponse> response = salesQueryRepository.findYearlySalesById(
                franchise.getId(), Year.of(2026)
        );

        assertThat(response).hasValueSatisfying(sales -> {
            assertThat(sales).extracting(
                    FranchiseYearlySalesResponse::franchiseId,
                    FranchiseYearlySalesResponse::franchiseName,
                    FranchiseYearlySalesResponse::salesYear,
                    FranchiseYearlySalesResponse::totalSalesAmount,
                    FranchiseYearlySalesResponse::totalOrderCount,
                    FranchiseYearlySalesResponse::averageSalesAmount,
                    FranchiseYearlySalesResponse::averageOrderAmount,
                    FranchiseYearlySalesResponse::salesMonths
            ).containsExactly(
                    franchise.getId(),
                    franchise.getFranchiseName(),
                    2026,
                    6_000L,
                    60L,
                    2_000.0,
                    20.0,
                    2
            );

            assertThat(sales.monthlySales()).containsExactly(
                    new FranchiseYearlySalesResponse.MonthlySalesPoint(
                            202601, 3_000L, 30L
                    ),
                    new FranchiseYearlySalesResponse.MonthlySalesPoint(
                            202602, 3_000L, 30L
                    )
            );
        });
    }

    @Test
    @DisplayName("월 매출 조회 - 월 요약과 일별 매출 포인트를 조회한다")
    void findMonthlySalesById_success() {
        Franchise franchise = saveFranchise();
        Franchise otherFranchise = saveFranchise();

        saveSales(franchise, LocalDate.of(2026, 4, 1), 1_000L, 10L);
        saveSales(franchise, LocalDate.of(2026, 4, 2), 2_000L, 30L);
        saveSales(franchise, LocalDate.of(2026, 5, 1), 9_000L, 90L);
        saveSales(otherFranchise, LocalDate.of(2026, 4, 1), 8_000L, 80L);

        Optional<FranchiseMonthlySalesResponse> response = salesQueryRepository.findMonthlySalesById(
                franchise.getId(), YearMonth.of(2026, 4)
        );

        assertThat(response).hasValueSatisfying(sales -> {
            assertThat(sales).extracting(
                    FranchiseMonthlySalesResponse::franchiseId,
                    FranchiseMonthlySalesResponse::franchiseName,
                    FranchiseMonthlySalesResponse::salesMonth,
                    FranchiseMonthlySalesResponse::totalSalesAmount,
                    FranchiseMonthlySalesResponse::totalOrderCount,
                    FranchiseMonthlySalesResponse::averageOrderAmount,
                    FranchiseMonthlySalesResponse::averageDailySalesAmount,
                    FranchiseMonthlySalesResponse::salesDays
            ).containsExactly(
                    franchise.getId(),
                    franchise.getFranchiseName(),
                    202604,
                    3_000L,
                    40L,
                    20.0,
                    1_500.0,
                    2
            );

            assertThat(sales.dailySales()).containsExactly(
                    new FranchiseMonthlySalesResponse.DailySalesPoint(
                            20260401, 1_000L, 10L
                    ),
                    new FranchiseMonthlySalesResponse.DailySalesPoint(
                            20260402, 2_000L, 30L
                    )
            );
        });
    }

    private Franchise saveFranchise() {
        String token = UUID.randomUUID().toString().substring(0, 8);
        return franchiseRepository.save(Franchise.create(
                "000-00-00000",
                "Sales Query " + token,
                "Seoul " + token,
                "Owner " + token,
                "010-1234-5678",
                "sales-query-" + token + "@example.com",
                null
        ));
    }

    private FranchiseDailySales saveSales(
            Franchise franchise,
            LocalDate salesDate,
            Long salesAmount,
            Long orderCount
    ) {
        return dailySalesRepository.save(FranchiseDailySales.create(
                "sales-query-" + salesDate + "-" + UUID.randomUUID(),
                salesDate,
                salesAmount,
                orderCount,
                franchise
        ));
    }
}
