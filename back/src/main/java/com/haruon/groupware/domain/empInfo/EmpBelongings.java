package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpBelongings extends AbstractEntity {

    private Emp emp;

    private Dept dept;

    private PositionCode position;

    private boolean isPrimary;

    private LocalDate startAt;

    @Nullable private LocalDate endAt;

    static EmpBelongings registerEmpBelonging(
            Emp emp,
            Dept dept,
            PositionCode position,
            LocalDate startAt,
            boolean isPrimary) {
        EmpBelongings empBelongings = new EmpBelongings();

        empBelongings.emp = requireNonNull(emp);
        empBelongings.dept = requireNonNull(dept);
        empBelongings.position = requireNonNull(position);
        empBelongings.startAt = requireNonNull(startAt);
        empBelongings.isPrimary = isPrimary;

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
