package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

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

    private SalesDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static SalesDraft createDraft(
            Emp emp,
            String title,
            String content,
            YearMonth reportMonth,
            Long salesAmount,
            List<ApproversParam> approvers
    ) {
        SalesDraft salesDraft = new SalesDraft(title, content, emp);

        salesDraft.init(reportMonth, salesAmount);
        salesDraft.createDraftApproval(approvers);

        return salesDraft;
    }

    public static SalesDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            YearMonth reportMonth,
            Long salesAmount,
            List<ApproversParam> approvers,
            LocalDateTime submittedAt
    ) {
        SalesDraft salesDraft = new SalesDraft(title, content, emp);

        salesDraft.init(reportMonth, salesAmount);
        salesDraft.createSubmittedApproval(approvers, submittedAt);

        return salesDraft;
    }

    public void editSalesDraft(
            @Nullable String title,
            @Nullable String content,
            @Nullable YearMonth reportMonth,
            @Nullable Long salesAmount
    ) {
        editDraft(title, content);

        YearMonth editedReportMonth = reportMonth != null ? reportMonth : this.reportMonth;
        long editedSalesAmount = salesAmount != null ? salesAmount : this.salesAmount;

        validateSalesInitParam(editedReportMonth, editedSalesAmount);

        this.reportMonth = editedReportMonth;
        this.salesAmount = editedSalesAmount;
    }

    private void init(
            YearMonth reportMonth, Long salesAmount
    ) {
        validateSalesInitParam(reportMonth, salesAmount);

        this.reportMonth = reportMonth;
        this.salesAmount = salesAmount;
    }

    private static void validateSalesInitParam(YearMonth reportMonth, Long salesAmount) {
        requireNonNull(reportMonth, "대상연월은 null일 될 수 없음");
        requireNonNull(salesAmount, "매출액은 null일 될 수 없음");
        state(salesAmount > 0, "매출액은 마이너스가 될 수 없음");
    }

}
