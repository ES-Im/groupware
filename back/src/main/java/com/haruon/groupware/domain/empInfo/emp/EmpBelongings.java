package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Dept;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

@Entity
@Table(
      uniqueConstraints = {@UniqueConstraint(
              columnNames = {"emp_id", "dept_id", "startAt"}
      )}
)
public class EmpBelongings extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="dept_id", nullable = false)
    private Dept dept;

    private PositionCode position;

    private boolean isPrimary;

    @Column(nullable = false)
    private LocalDate startAt;

    @Nullable
    private LocalDate endAt;


}
