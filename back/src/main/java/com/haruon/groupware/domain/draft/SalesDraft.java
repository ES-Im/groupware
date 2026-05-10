package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = "franchise")
public class SalesDraft extends Draft {

    private Franchise franchise;

    private YearMonth reportMonth;

    private long salesAmount;

    private SalesDraft(String title, String content, Emp emp) {
        super(title, content, emp);
        state(emp.getStatus().equals(EmpStatus.ACTIVE), "활성화된 사원이 아님");
        state(emp.getSystemRoles().contains(SystemRoleCode.FRANCHISE), "가맹점 권한이 없음");
    }

    public static SalesDraft createDraft(
            Emp emp,
            Franchise franchise,
            String title,
            String content,
            YearMonth reportMonth,
            Long salesAmount,
            @Nullable List<ApproversParam> approvers
    ) {
        SalesDraft salesDraft = new SalesDraft(title, content, emp);

        salesDraft.init(reportMonth, salesAmount, franchise);
        salesDraft.createDraftApproval(approvers);

        return salesDraft;
    }

    public static SalesDraft createSubmitted(
            Emp emp,
            Franchise franchise,
            String title,
            String content,
            YearMonth reportMonth,
            Long salesAmount,
            List<ApproversParam> approvers,
            LocalDateTime submittedAt
    ) {
        SalesDraft salesDraft = new SalesDraft(title, content, emp);

        salesDraft.init(reportMonth, salesAmount, franchise);
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
            YearMonth reportMonth, Long salesAmount, Franchise franchise
    ) {
        validateSalesInitParam(reportMonth, salesAmount);

        this.reportMonth = reportMonth;
        this.salesAmount = salesAmount;
        this.franchise = franchise;
    }

    private static void validateSalesInitParam(YearMonth reportMonth, Long salesAmount) {
        requireNonNull(reportMonth, "대상연월은 null일 될 수 없음");
        requireNonNull(salesAmount, "매출액은 null일 될 수 없음");
        state(salesAmount > 0, "매출액은 마이너스가 될 수 없음");
    }

}
