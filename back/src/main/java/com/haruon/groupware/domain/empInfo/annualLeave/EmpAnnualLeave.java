package com.haruon.groupware.domain.empInfo.annualLeave;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft_approval.report.LeaveType;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Period;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"emp_id", "grant_year"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class EmpAnnualLeave extends AbstractEntity {

    private static final double DEFAULT_LEAVE_YEAR = 15.0;

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private Integer grantYear;

    @Column(nullable = false)
    private Double baseGrantDays;

    @Column(nullable = false)
    @Enumerated
    private LeaveType leaveType;    // 연차, 대체휴무, 특휴

    private Double additionalGrantDays; // 대휴, 특휴 지급일자

    @Column(nullable = false)
    private Double usedDays;

    public static EmpAnnualLeave createEmpAnnualLeave(Emp emp, Integer grantYear) {
        EmpAnnualLeave empAnnualLeave = new EmpAnnualLeave();

        empAnnualLeave.emp = requireNonNull(emp);
        empAnnualLeave.grantYear = requireNonNull(grantYear);

        LocalDate baseDate = LocalDate.of(grantYear, 1, 1);


        empAnnualLeave.baseGrantDays = empAnnualLeave.calculateTotalLeaveDays(emp.getHiredAt(), baseDate);
        empAnnualLeave.additionalGrantDays = 0.0;
        empAnnualLeave.usedDays = 0.0;

        return empAnnualLeave;
    }

    public void recalculateAdditionalLeave(double modifyDays) {
        state(this.additionalGrantDays + modifyDays >= 0, "부여 연차 수가 마이너스");

        this.additionalGrantDays += modifyDays;
    }

    public double calculateRemainedLeaveDays() {
        return this.baseGrantDays + this.additionalGrantDays - this.usedDays;
    }

    public void useLeaveDays(double modifyDays) {
        state(calculateRemainedLeaveDays() - modifyDays >= 0, "잔여 연차 이상 사용불가");

        this.usedDays += modifyDays;
    }

    private double calculateTotalLeaveDays(LocalDate hiredAt, LocalDate now) {
        state(hiredAt != null, "입사일자 값 없음");
        state(!now.isBefore(hiredAt), "연차 부여일이 입사일보다 빠를 수 없음");

        Period diff =  Period.between(hiredAt, now);
        int yearsOfService = diff.getYears();

        if (yearsOfService < 1) {
            long completedMonths = diff.getMonths();
            return Math.min(completedMonths, 11);
        }

        return Math.min(DEFAULT_LEAVE_YEAR + Math.max(0, (yearsOfService - 1) / 2), 25);
    }


}
