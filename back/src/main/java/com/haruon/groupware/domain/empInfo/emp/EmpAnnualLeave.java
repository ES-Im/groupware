package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"emp_id", "grant_year"})
)
public class EmpAnnualLeave extends AbstractEntity {

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    private Integer grantYear;

    private Double totalDays;

    private Double usedDays;

}
