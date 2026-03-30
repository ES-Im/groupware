package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.dto.EmpBelongingsParam;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;

@Entity
@Table(
      uniqueConstraints = {@UniqueConstraint(
              columnNames = {"emp_id", "dept_id", "startAt"}
      )}
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpBelongings extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable=false)
    private Emp emp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="dept_id", nullable = false)
    private Dept dept;

    @Enumerated(EnumType.STRING)
    private PositionCode position;

    private boolean isPrimary;

    @Column(nullable = false)
    private LocalDate startAt;

    @Nullable
    private LocalDate endAt;

    static EmpBelongings registerEmpBelonging(
            Emp emp,
            EmpBelongingsParam request) {
        EmpBelongings empBelongings = new EmpBelongings();

        empBelongings.emp = requireNonNull(emp);
        empBelongings.dept = requireNonNull(request.dept());
        empBelongings.position = requireNonNull(request.position());
        empBelongings.startAt = requireNonNull(request.startAt());
        empBelongings.isPrimary = requireNonNull(request.isPrimary());

        return empBelongings;
    }

    void markEnd(LocalDate endAt) {
        this.endAt = requireNonNull(endAt);
        this.isPrimary = false;
    }

    void markPrimary() {
        this.isPrimary = true;
    }

    void unmarkPrimary() {
        this.isPrimary = false;
    }

    void changeStartAt(LocalDate startAt) {
        this.startAt = requireNonNull(startAt);
    }

    void changeEndAt(LocalDate endAt) {
        this.endAt = requireNonNull(endAt);
    }

    void changePosition(PositionCode position) {
        this.position = requireNonNull(position);
    }


}
