package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"emp_id", "grant_year"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpAnnualLeave extends AbstractEntity {

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    private Integer grantYear;

    private Double totalDays;

    private Double usedDays;

    private Double additionalGrantDays;

    // 매년 1월 1일 배치처리로 각 사원의 연차 계산
    public static EmpAnnualLeave createEmpAnnualLeave(Emp emp, Integer grantYear) {
        EmpAnnualLeave empAnnualLeave = new EmpAnnualLeave();

        empAnnualLeave.emp = requireNonNull(emp);
        empAnnualLeave.grantYear = requireNonNull(grantYear);

        int 연차 = LocalDate.now().getYear() - emp.getHiredAt().getYear();

        return empAnnualLeave;
    }

    // 연가 쓰면 차감하는 거

    // 연가 정정하는 거

    // 연가 종류별로 .. ?

    // 연가 + 특휴 조회하는거
}
