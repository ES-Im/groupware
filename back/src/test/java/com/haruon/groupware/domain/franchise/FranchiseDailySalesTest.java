package com.haruon.groupware.domain.franchise;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.franchise.franchiseFixture.getFranchise;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FranchiseDailySalesTest {

    @Test
    @DisplayName("일매출건수 생성")
    void createSales_success() {
        String externalId = "external";
        LocalDate salesDate = LocalDate.of(2026,4,1);
        Long salesAmount = 1000000L;
        Long orderCount = 1000L;
        Franchise franchise = getFranchise();

        FranchiseDailySales sales = FranchiseDailySales.create(externalId, salesDate, salesAmount, orderCount, franchise);

        assertThat(sales).extracting(
                FranchiseDailySales::getExternalId,
                FranchiseDailySales::getSalesDate,
                FranchiseDailySales::getSalesAmount,
                FranchiseDailySales::getOrderCount,
                FranchiseDailySales::getFranchise
        ).containsExactly(
                externalId, salesDate, salesAmount, orderCount, franchise
        );
    }

    private static Stream<Arguments> createSales_fail_params() {

        return Stream.of(
                Arguments.of("매출액은 0 이상",
                        -1L, 1000L
                ), Arguments.of("매출건수는 0이상",
                        1000000L, -1L
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("createSales_fail_params")
    @DisplayName("일매출건수 생성실패")
    void createSales_fail_cases(String description, Long salesAmount, Long orderCount) {
        assertThrows(IllegalStateException.class, () ->
                FranchiseDailySales.create("external", LocalDate.now(), salesAmount, orderCount, getFranchise())
        );
    }

    @Test
    @DisplayName("일매출건수 교체 테스트")
    void replace_sales_success() {
        LocalDate newSalesDate = LocalDate.of(2026,4,5);
        Long newSalesAmount = 2000000L;
        Long newOrderCount = 2000L;

        FranchiseDailySales sales = FranchiseDailySales.create(
                "external",
                LocalDate.of(2026,4,1),
                1000000L,
                1000L,
                getFranchise());

        sales.replace(newSalesDate, newSalesAmount, newOrderCount);

        assertThat(sales).extracting(
                FranchiseDailySales::getSalesDate,
                FranchiseDailySales::getSalesAmount,
                FranchiseDailySales::getOrderCount
        ).containsExactly(
                newSalesDate, newSalesAmount, newOrderCount);
    }


    private static Stream<Arguments> replaceSales_fail_params() {

        return Stream.of(
                Arguments.of("매출액은 0 이상",
                        -1L, 1000L
                ), Arguments.of("매출건수는 0이상",
                        1000000L, -1L
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("replaceSales_fail_params")
    @DisplayName("일매출건수 교체실패")
    void replaceSales_fail_cases(String description, Long salesAmount, Long orderCount) {
        FranchiseDailySales sales = FranchiseDailySales.create(
                "external",
                LocalDate.of(2026,4,1),
                1000000L,
                1000L,
                getFranchise()
        );


        assertThrows(IllegalStateException.class, () ->
                sales.replace(LocalDate.now(), salesAmount, orderCount)
        );
    }

}