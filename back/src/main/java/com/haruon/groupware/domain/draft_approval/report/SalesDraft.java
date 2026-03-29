package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.*;

import java.time.YearMonth;

@Entity
@DiscriminatorValue("SALES")
public class SalesDraft extends Draft {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id", nullable = false)
    private Franchise franchise;

    @Column(nullable = false)
    private YearMonth reportMonth;

    @Column(nullable = false)
    private long salesAmount;
}
