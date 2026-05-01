package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseDailySalesRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.DailySalesRequest;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseDailySales;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@TestIntegrationConfig
record FranchiseDailySalesImporterTest(
        FranchiseDailySalesRepository dailySalesRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        FranchiseDailySalesImporter importer,
        FranchiseManagement franchiseManagement
) {

    @AfterEach
    void tearDown() {
        dailySalesRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }


    @Test
    @DisplayName("일매출 등록 테스트 - DB에 externalId가 없으면 일매출을 신규 등록한다")
    void createSales_success() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );

        String externalId = "external";
        LocalDate salesDate = LocalDate.of(2026,4,1);
        Double salesAmount = 1000000.0;
        Long orderCount = 100L;

        long salesId = importer.importDailySales(
                franchise.getId(),
                DailySalesRequest.builder()
                        .externalId(externalId)
                        .salesDate(salesDate)
                        .salesAmount(salesAmount)
                        .orderCount(orderCount)
                        .build()
        );

        FranchiseDailySales sales = dailySalesRepository.findById(salesId).orElseThrow();

        assertThat(sales).extracting(
                FranchiseDailySales::getFranchise,
                FranchiseDailySales::getExternalId,
                FranchiseDailySales::getSalesAmount,
                FranchiseDailySales::getSalesDate,
                FranchiseDailySales::getOrderCount
        ).containsExactly(
                franchise, externalId, salesAmount, salesDate, orderCount
        );

    }

    @Test
    @DisplayName("일매출 교체 테스트 - DB에 externalId가 있으면 기존 일매출을 갱신하고 새 데이터를 만들지 않는다")
    void replaceSales_success() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );
        String externalId = "external";
        long salesId = importer.importDailySales(
                franchise.getId(),
                DailySalesRequest.builder()
                        .externalId(externalId)
                        .salesDate(LocalDate.of(2026,4,1))
                        .salesAmount(1000000.0)
                        .orderCount(100L)
                        .build()
        );

        LocalDate newSalesDate = LocalDate.of(2026,4,1);
        Double newSalesAmount = 0.0;
        Long newOrderCount = 0L;

        importer.importDailySales(
                franchise.getId(),
                DailySalesRequest.builder()
                        .externalId(externalId)
                        .salesDate(newSalesDate)
                        .salesAmount(newSalesAmount)
                        .orderCount(newOrderCount)
                        .build()
        );

        FranchiseDailySales sales = dailySalesRepository.findById(salesId).orElseThrow();

        assertThat(sales).extracting(
                FranchiseDailySales::getFranchise,
                FranchiseDailySales::getExternalId,
                FranchiseDailySales::getSalesAmount,
                FranchiseDailySales::getSalesDate,
                FranchiseDailySales::getOrderCount
        ).containsExactly(
                franchise, externalId, newSalesAmount, newSalesDate, newOrderCount
        );

        assertThat(dailySalesRepository.count())
                .as("교체시, row가 더 증가하진 않는다.")
                .isEqualTo(1);

    }

    @Test
    @DisplayName("일매출 교체 테스트 - 교체하더라도, 매출익/매출액/매출건수 중 하나라도 null이면 교체에 실패한다.")
    void replaceSales_fail() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );
        String externalId = "external";
        importer.importDailySales(
                franchise.getId(),
                DailySalesRequest.builder()
                        .externalId(externalId)
                        .salesDate(LocalDate.of(2026,4,1))
                        .salesAmount(1000000.0)
                        .orderCount(100L)
                        .build()
        );

        LocalDate newSalesDate = LocalDate.of(2026,4,1);
        Double newSalesAmount = 0.0;

        assertThrows(NullPointerException.class, () ->
            importer.importDailySales(
                    franchise.getId(),
                    DailySalesRequest.builder()
                            .externalId(externalId)
                            .salesDate(newSalesDate)
                            .salesAmount(newSalesAmount)
                            .build()
            )
        );

    }

}