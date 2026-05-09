package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"emp_id", "grant_year"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class EmpLeave extends AbstractEntity {

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private Integer grantYear;

    @Column(nullable = false)
    private Double annualBaseGrantDays;

    @Column(nullable = false)
    private Double annualUsedDays;

    @Column(nullable = false)
    private Double specialGrantDays;

    @Column(nullable = false)
    private Double specialUsedDays;

    @Column(nullable = false)
    private Double compensatoryGrantDays;

    @Column(nullable = false)
    private Double compensatoryUsedDays;

    public static EmpLeave createEmpLeave(
            Emp emp,
            Integer grantYear,
            double grantedAnnualLeaveDate
    ) {
        state(grantedAnnualLeaveDate >= 0, "부여 연차는 마이너스가 될 수 없다.");

        EmpLeave annualEmpLeave = new EmpLeave();

        annualEmpLeave.emp = requireNonNull(emp);
        annualEmpLeave.grantYear = requireNonNull(grantYear);
        annualEmpLeave.annualBaseGrantDays = grantedAnnualLeaveDate;
        annualEmpLeave.annualUsedDays = 0.0;
        annualEmpLeave.specialGrantDays = 0.0;
        annualEmpLeave.specialUsedDays = 0.0;
        annualEmpLeave.compensatoryGrantDays = 0.0;
        annualEmpLeave.compensatoryUsedDays = 0.0;

        return annualEmpLeave;
    }

    public void adjustSpecialGrantDays(double plusMinusDays) {
        validateDaysAfterAdjust(this.specialGrantDays, plusMinusDays);

        this.specialGrantDays += plusMinusDays;
    }

    public void adjustCompensatoryGrantDays(double plusMinusDays) {
        validateDaysAfterAdjust(this.compensatoryGrantDays, plusMinusDays);

        this.compensatoryGrantDays += plusMinusDays;
    }

    public void useAnnualDays(double usedDays) {
        validateDaysAfterUse(this.annualBaseGrantDays, this.annualUsedDays, usedDays);

        this.annualUsedDays += usedDays;
    }

    public void useSpecialDays(double usedDays) {
        validateDaysAfterUse(this.specialGrantDays, this.specialUsedDays, usedDays);

        this.specialUsedDays += usedDays;
    }

    public void useCompensatoryDays(double usedDays) {
        validateDaysAfterUse(this.compensatoryGrantDays, this.compensatoryUsedDays, usedDays);

        this.compensatoryUsedDays += usedDays;
    }

    private void validateDaysAfterUse(double grantedDays, double usedDays, double willBeUsedDays) {
        state(willBeUsedDays > 0, "사용일수는 음수일 수 없음");
        state(( grantedDays - usedDays - willBeUsedDays) >= 0,
                "사용 후 남은 연차/휴가 일 수는 마이너스가 될 수 없음");
    }

    private void validateDaysAfterAdjust(double grantedDays, double willBalancedDays) {
        state(grantedDays + willBalancedDays >= 0, "조정 후의 일수는 음수일 수 없음");
    }


}
