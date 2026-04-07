package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.YearMonth;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@DiscriminatorValue("SALES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SalesDraft extends Draft {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id", nullable = false)
    private Franchise franchise;

    @Column(nullable = false)
    private YearMonth reportMonth;

    @Column(nullable = false)
    private long salesAmount;

    private SalesDraft(Emp emp, String title, String content) {
        super(emp, title, content);
    }

    public static SalesDraft submitSalesDraft(
            Emp emp, String title, String content,
            YearMonth reportMonth, Long salesAmount
    ) {
        SalesDraft draft = new SalesDraft(emp, title, content);

        requireNonNull(reportMonth);
        requireNonNull(salesAmount);

        draft.reportMonth = reportMonth;
        draft.salesAmount = salesAmount;

        return draft;
    }
}
