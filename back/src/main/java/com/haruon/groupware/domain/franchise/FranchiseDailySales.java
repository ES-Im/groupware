package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Getter
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"sales_date", "franchise_id"})})
public class FranchiseDailySales extends AbstractEntity {

    @Column(nullable = false, unique = true, updatable = false)
    private String externalId;

    @Column(nullable = false)
    private LocalDate salesDate;

    @Column(nullable = false)
    private long salesAmount;

    @Column(nullable = false)
    private long orderCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id", nullable = false)
    private Franchise franchise;

    public static FranchiseDailySales create(
            String externalId, LocalDate salesDate, Long salesAmount, Long orderCount, Franchise franchise
    ) {
        FranchiseDailySales franchiseDailySales = new FranchiseDailySales();
        state(salesAmount >= 0, "매출액은 0이거나 양수여야한다.");
        state(orderCount >= 0, "거래건수는 0이거나 양수여야한다.");


        franchiseDailySales.externalId = requireNonNull(externalId);
        franchiseDailySales.salesDate = requireNonNull(salesDate);
        franchiseDailySales.salesAmount = requireNonNull(salesAmount);
        franchiseDailySales.orderCount = requireNonNull(orderCount);
        franchiseDailySales.franchise = requireNonNull(franchise);

        return franchiseDailySales;
    }

    public void replace(
            LocalDate salesDate,
            Long salesAmount,
            Long orderCount
    ) {
        state(salesAmount >= 0, "매출액은 0이거나 양수여야한다.");
        state(orderCount >= 0, "거래건수는 0이거나 양수여야한다.");

        this.salesDate = requireNonNull(salesDate);
        this.salesAmount = requireNonNull(salesAmount);
        this.orderCount = requireNonNull(orderCount);
    }

}
