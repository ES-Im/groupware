package com.haruon.groupware.queryDLSTest;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.FranchiseDailySalesImporter;
import com.haruon.groupware.application.franchise.provided.FranchiseManagement;
import com.haruon.groupware.application.franchise.required.FranchiseDailySalesRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.required.FranchiseSalesQueryRepository;
import com.haruon.groupware.application.franchise.service.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.dto.SalesResult;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;

@Slf4j
@TestIntegrationConfig
record FranchiseSalesQueryRepositoryTest(
        FranchiseSalesQueryRepository franchiseSalesQueryRepository,
        DeptRepository deptRepository,
        EmpRepository empRepository,
        FranchiseRepository franchiseRepository,
        FranchiseDailySalesRepository dailySalesRepository,
        FranchiseDailySalesImporter importer,
        FranchiseManagement franchiseManagement,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        dailySalesRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    void findMonthlySalesByFranchiseId() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );
        importer.importDailySales(
                franchise.getId(),
                DailySalesRequest.builder()
                        .externalId("externalId")
                        .salesDate(LocalDate.of(2026,4,1))
                        .salesAmount(1000000L)
                        .orderCount(100L)
                        .build()
        );

        log.info("================= 테스트 대상 쿼리 시작 =========================");
        SalesResult result = franchiseSalesQueryRepository
                .findMonthlySalesByFranchiseId(franchise.getId(), YearMonth.of(2026, 4))
                .orElseThrow();

        log.info(result.toString());
        log.info("================= 테스트 대상 쿼리 종료 =========================");
    }
}