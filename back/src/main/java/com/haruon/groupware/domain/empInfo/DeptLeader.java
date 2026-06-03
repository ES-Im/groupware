package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true, exclude = {"dept", "emp"})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeptLeader extends AbstractEntity {

    private Dept dept;

    private Emp emp;

    private LocalDate startAt;

    @Nullable private LocalDate endAt;

    static DeptLeader appoint(Dept dept, Emp emp, LocalDate startAt) {
        requireNonNull(dept, "부서 정보는 필수입니다.");
        requireNonNull(emp, "부서장 사원 정보는 필수입니다.");
        requireNonNull(startAt, "부서장 시작일은 필수입니다.");

        DeptLeader deptLeader = new DeptLeader();
        deptLeader.dept = dept;
        deptLeader.emp = emp;
        deptLeader.startAt = startAt;

        return deptLeader;
    }

    public boolean isCurrent() {
        return this.endAt == null;
    }

    void changeStartAt(LocalDate startAt) {
        LocalDate newStartAt = requireNonNull(startAt, "부서장 시작일은 필수입니다.");

        if (this.endAt != null) {
            validatePeriod(newStartAt, this.endAt);
        }

        this.startAt = newStartAt;
    }

    void markEnd(LocalDate endAt) {
        LocalDate newEndAt = requireNonNull(endAt, "부서장 종료일은 필수입니다.");

        state(isCurrent(), "이미 종료된 부서장 이력입니다.");
        validatePeriod(this.startAt, newEndAt);

        this.endAt = newEndAt;
    }

    void changeEndAt(@Nullable LocalDate endAt) {
        if (endAt != null) {
            validatePeriod(this.startAt, endAt);
        }

        this.endAt = endAt;
    }

    private static void validatePeriod(LocalDate startAt, LocalDate endAt) {
        state(!endAt.isBefore(startAt), "부서장 종료일은 시작일보다 빠를 수 없습니다.");
    }
}
