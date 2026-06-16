package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.franchise.required.FranchiseSalesQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;
import com.haruon.groupware.domain.franchise.QFranchise;
import com.haruon.groupware.domain.franchise.QFranchiseDailySales;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FranchiseSalesQueryRepositoryAdapter implements FranchiseSalesQueryRepository {

    private final JPAQueryFactory query;
    private final QFranchise franchise = QFranchise.franchise;
    private final QFranchiseDailySales dailySales = QFranchiseDailySales.franchiseDailySales;

    /**
     *  List<MonthlySalesPoint> monthlySales 제외 DTO 필드
     * select f.id, f.name,
     *        year(d.salesDate),
     *        sum(d.sales_amount),
     *        sum(d.orderCount),
     *        sum(d.salesAmount)  / count(distinct month(d.sales_date)),
     *        sum(d.orderCount)  / count(distinct month(d.sales_date)),
     *        count(distinct month(d.sales_date))
     *   from dailySales d
     *   join franchise f (using f.id)
     *  where f.id = franchiseId
     *  group by year(d.salesDate)
     *
     *  List<MonthlySalesPoint>
     *  select date_format(d.sales_cate, '%Y-%m') as groupigmonth, sum(d.sales_amount), sum(d.orderCount)
     *    from daily_sales d
     *   where d.franchiseId = :franchiseId
     *     and sales_date >= :year의 첫날
     *     and sales_date < :year의 마지막날 + 1
     *   group by groupigmonth
     *   order by groupigmonth
     */
    @Override
    public Optional<FranchiseYearlySalesResponse> findYearlySalesById(Long franchiseId, Year year) {
        LocalDate startAt = LocalDate.of(year.getValue(), 1, 1);
        LocalDate endAt = LocalDate.of(year.getValue(), 12, 31).plusDays(1);

        FranchiseYearlySalesResponse.YearlySalesSummary yearlySalesSummary =
                query
                        .select(Projections.constructor(
                                FranchiseYearlySalesResponse.YearlySalesSummary.class,
                                franchise.id,
                                franchise.franchiseName,
                                dailySales.salesDate.year(),
                                dailySales.salesAmount.sumLong(),
                                dailySales.orderCount.sumLong(),
                                dailySales.salesAmount.avg(),
                                dailySales.orderCount.avg(),
                                dailySales.salesDate.month().countDistinct().intValue()
                        ))
                        .from(dailySales)
                        .join(dailySales.franchise, franchise)
                        .where(
                                franchise.id.eq(franchiseId),
                                dailySales.salesDate.goe(startAt),
                                dailySales.salesDate.lt(endAt)
                        )
                        .groupBy(franchise.id, franchise.franchiseName, dailySales.salesDate.year())
                        .fetchOne();

        if (yearlySalesSummary == null) return Optional.empty();

        List<FranchiseYearlySalesResponse.MonthlySalesPoint> pointList = query.select(Projections.constructor(
                        FranchiseYearlySalesResponse.MonthlySalesPoint.class,
                        dailySales.salesDate.yearMonth(), dailySales.salesAmount.sumLong(), dailySales.orderCount.sumLong()
                ))
                .from(dailySales)
                .where(
                        dailySales.franchise.id.eq(franchiseId),
                        dailySales.salesDate.goe(startAt),
                        dailySales.salesDate.lt(endAt)
                )
                .groupBy(dailySales.salesDate.yearMonth())
                .orderBy(dailySales.salesDate.yearMonth().asc())
                .fetch();

        return Optional.of(new FranchiseYearlySalesResponse(yearlySalesSummary, pointList));
    }

    @Override
    public Optional<FranchiseMonthlySalesResponse> findMonthlySalesById(Long franchiseId, YearMonth yearMonth) {
        LocalDate startAt = LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), 1);
        LocalDate endAt = LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), yearMonth.lengthOfMonth()).plusDays(1);

        FranchiseMonthlySalesResponse.MonthlySalesSummary monthlySalesSummary = query
                .select(Projections.constructor(
                        FranchiseMonthlySalesResponse.MonthlySalesSummary.class,
                        franchise.id, franchise.franchiseName,
                        dailySales.salesDate.yearMonth(),
                        dailySales.salesAmount.sumLong(),
                        dailySales.orderCount.sumLong(),
                        dailySales.orderCount.avg(),
                        dailySales.salesAmount.avg(),
                        dailySales.salesDate.countDistinct().intValue()
                )).from(dailySales)
                .join(dailySales.franchise, franchise)
                .where(
                        franchise.id.eq(franchiseId),
                        dailySales.salesDate.goe(startAt),
                        dailySales.salesDate.lt(endAt)
                )
                .groupBy(franchise.id, franchise.franchiseName, dailySales.salesDate.yearMonth())
                .fetchOne();

        if(monthlySalesSummary == null) return Optional.empty();

        List<FranchiseMonthlySalesResponse.DailySalesPoint> pointList = query
                .select(Projections.constructor(
                        FranchiseMonthlySalesResponse.DailySalesPoint.class,
                        salesDateAsInteger(), dailySales.salesAmount, dailySales.orderCount
                ))
                .from(dailySales)
                .where(
                        dailySales.franchise.id.eq(franchiseId),
                        dailySales.salesDate.goe(startAt),
                        dailySales.salesDate.lt(endAt)
                )
                .orderBy(dailySales.salesDate.asc())
                .fetch();


        return Optional.of(new FranchiseMonthlySalesResponse(monthlySalesSummary, pointList));
    }

    private NumberExpression<Integer> salesDateAsInteger() {
        return dailySales.salesDate.year().multiply(10000)
                .add(dailySales.salesDate.month().multiply(100))
                .add(dailySales.salesDate.dayOfMonth());
    }

    @Override
    public Optional<FranchiseDailySalesResponse> findDailySalesById(Long franchiseId, LocalDate date) {
        return Optional.ofNullable(
                query
                        .select(Projections.constructor(
                                FranchiseDailySalesResponse.class,
                                franchise.id, franchise.franchiseName, dailySales.salesDate,
                                dailySales.salesAmount, dailySales.orderCount
                        )).from(dailySales)
                        .join(dailySales.franchise, franchise)
                        .where(
                                franchise.id.eq(franchiseId),
                                dailySales.salesDate.eq(date)
                        )
                        .fetchOne()
        );
    }
}
