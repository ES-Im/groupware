package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SalesDraftTest {

    @Test
    @DisplayName("매출보고 미상신 기안서 생성 테스트")
    void createDraft() {

        YearMonth reportMonth = YearMonth.of(2026,4);
        Long salesAmount = 1_000_000L;

        SalesDraft SalesDraft = getSalesDraft(reportMonth, salesAmount);

        assertThat(SalesDraft).extracting(
                com.haruon.groupware.domain.draft.SalesDraft::getReportMonth,
                com.haruon.groupware.domain.draft.SalesDraft::getSalesAmount
        ).containsExactly(
            reportMonth, salesAmount
        );

    }

    @Test
    @DisplayName("매출보고 상신 기안서 생성 테스트")
    void createSubmitted() {
        YearMonth reportMonth = YearMonth.of(2026,4);
        Long salesAmount = 1_000_000L;
        SalesDraft SalesDraft = getSalesSubmitted(reportMonth, salesAmount);

        assertThat(SalesDraft).extracting(
                com.haruon.groupware.domain.draft.SalesDraft::getReportMonth,
                com.haruon.groupware.domain.draft.SalesDraft::getSalesAmount
        ).containsExactly(
                reportMonth, salesAmount
        );
    }

    private static Stream<Arguments> initSalesDraftArguments() {
        YearMonth reportMonth = YearMonth.of(2026,4);
        Long salesAmount = 1_000_000L;

        return Stream.of(
                Arguments.of("매출액은 마이너스가 될 수 없음",
                        SalesDraftParam.builder().salesAmount(-1_000_000L).reportMonth(reportMonth).build()
                ),Arguments.of("대상연월은 null일 될 수 없음",
                        SalesDraftParam.builder().salesAmount(salesAmount).reportMonth(null).build()
                ),Arguments.of("매출액은 null일 될 수 없음",
                        SalesDraftParam.builder().salesAmount(null).reportMonth(reportMonth).build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("initSalesDraftArguments")
    @DisplayName("연차신청서 기안 실패 케이스")
    void init_Sales_draft_fail(String expectedMessage, SalesDraftParam param) {
        assertThatThrownBy(() ->
                getSalesDraft(
                    param.reportMonth(), param.salesAmount()
                )
        ).hasMessage(expectedMessage);
    }

    @Test
    @DisplayName("매출보고 수정 실패 케이스")
    void edit_SalesDraft_fail() {
        long errorSales = -1_000_000L;

        assertThatThrownBy(() ->
                getSalesDraft(
                        YearMonth.of(2026, 4), errorSales
                )
        ).hasMessage("매출액은 마이너스가 될 수 없음");
    }
    private static Stream<Arguments> editArguments() {
        YearMonth reportMonth = YearMonth.of(2026,4);
        Long salesAmount = 1_000_000L;

        return Stream.of(
                Arguments.of("reportMonth을 수정할 수 있다.",
                        SalesDraftParam.builder().reportMonth(reportMonth).build()
                ),Arguments.of("매출액을 수정할 수 있다.",
                        SalesDraftParam.builder().salesAmount(salesAmount).build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editArguments")
    @DisplayName("매출보고서 수정 케이스")
    void edit_SalesDraft_fail(String expectedMessage, SalesDraftTest.SalesDraftParam param) {
        SalesDraft SalesDraft = getSalesDraft(YearMonth.of(2025,4), 1L);

        SalesDraft.editSalesDraft(
                null, null,
                param.reportMonth(),
                param.salesAmount()
        );
    }

    @Builder
    private record SalesDraftParam(
            YearMonth reportMonth, Long salesAmount
    ) {}

    private static SalesDraft getSalesDraft(YearMonth reportMonth, Long salesAmount) {
        return SalesDraft.createDraft(
                getApprovedEmp(), "title", "content",
                reportMonth, salesAmount,
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp("202601101", "approver")))
        );
    }

    private static SalesDraft getSalesSubmitted(YearMonth reportMonth, Long salesAmount) {
        return SalesDraft.createSubmitted(
                getApprovedEmp(), "title", "content",
                reportMonth, salesAmount,
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp("202601101", "approver"))),
                LocalDateTime.of(2026,4,1,0,0,0)
        );
    }

}