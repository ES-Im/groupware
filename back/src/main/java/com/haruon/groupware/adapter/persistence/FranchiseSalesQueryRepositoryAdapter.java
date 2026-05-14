package com.haruon.groupware.adapter.persistence;

import com.haruon.groupware.application.franchise.required.FranchiseSalesQueryRepository;
import com.haruon.groupware.application.franchise.service.dto.SalesResult;
import com.haruon.groupware.domain.franchise.QFranchiseDailySales;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FranchiseSalesQueryRepositoryAdapter implements FranchiseSalesQueryRepository {

    private final JPAQueryFactory query;

    @Override
    public Optional<SalesResult> findMonthlySalesByFranchiseId(Long franchiseId, YearMonth yearMonth) {
        int year = yearMonth.getYear();
        int month = yearMonth.getMonthValue();

        QFranchiseDailySales sales = QFranchiseDailySales.franchiseDailySales;

        return Optional.ofNullable(query
                .select(Projections.constructor(
                        SalesResult.class,
                        sales.salesAmount.sumLong(),
                        sales.orderCount.sumLong()
                ))
                .from(sales)
                .where(
                        sales.franchise.id.eq(franchiseId),
                        sales.salesDate.year().eq(year),
                        sales.salesDate.month().eq(month)
                )
                .groupBy(sales.franchise.id)
                .fetchOne());
    }
}
