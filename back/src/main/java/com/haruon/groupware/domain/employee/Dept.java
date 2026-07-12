package com.haruon.groupware.domain.employee;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true, exclude = {"deptLeaders", "parentDept", "childDepts"})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dept extends AbstractEntity {

    private String deptCode;

    private String deptName;

    private boolean isActive;

    @Nullable private Dept parentDept;

    @Getter(AccessLevel.NONE)
    private List<Dept> childDepts = new ArrayList<>();

    private List<DeptLeader> deptLeaders = new ArrayList<>();

    public static Dept registerDept(String deptCode, String deptName) {
        Dept dept = new Dept();

        dept.deptCode = requireNonNull(deptCode);
        dept.deptName = requireNonNull(deptName);
        dept.isActive = true;

        return dept;
    }

    public void activate() {
        state(!this.isActive, "이미 활성화된 부서입니다.");
        state(this.parentDept == null || this.parentDept.isActive(), "상위 부서가 활성화되어야 하위 부서를 활성화할 수 있습니다.");

        this.isActive = true;
    }

    public void deactivate() {
        state(this.isActive, "이미 비활성화된 부서입니다.");
        state(isAllChildDeptsInactive(), "상위 부서를 비활성화하려면 하위 부서가 모두 비활성화되어야 합니다.");

        this.isActive = false;
    }

    public void renameDept(String newDeptName) {
        this.deptName = requireNonNull(newDeptName);
    }

    public void changeParent(@Nullable Dept newParentDept) {
        if (newParentDept != null) {
            state(!this.equals(newParentDept), "자기 자신을 상위 부서로 지정할 수 없습니다.");
            state(!newParentDept.isDescendantOf(this), "하위 부서를 상위 부서로 지정할 수 없습니다.");
            state(newParentDept.isActive || isAllTreeInactive(), "비활성 상위 부서에는 활성 부서를 배치할 수 없습니다.");
        }

        if (this.parentDept != null) {
            this.parentDept.childDepts.remove(this);
        }

        this.parentDept = newParentDept;

        if (newParentDept != null && !newParentDept.childDepts.contains(this)) {
            newParentDept.childDepts.add(this);
        }
    }

    public List<Dept> getChildDepts() {
        return Collections.unmodifiableList(this.childDepts);
    }

    public DeptLeader appointLeader(Emp emp, LocalDate startAt) {
        requireNonNull(emp, "부서장 사원 정보는 필수입니다.");
        LocalDate newStartAt = requireNonNull(startAt, "부서장 시작일은 필수입니다.");

        state(this.isActive, "비활성 부서에는 부서장을 지정할 수 없습니다.");
        emp.ensureActive();
        state(isCurrentMember(emp), "부서장은 해당 부서의 현재 소속 사원이어야 합니다.");

        DeptLeader currentLeader = getCurrentLeader();
        if(currentLeader != null) {
            state(!currentLeader.getEmp().equals(emp), "이미 현재 부서장인 사원입니다.");

            LocalDate currentLeaderEndAt = newStartAt.minusDays(1);
            state(!currentLeaderEndAt.isBefore(currentLeader.getStartAt()),
                    "새 부서장 시작일은 현재 부서장 시작일 이후여야 합니다.");
            currentLeader.markEnd(currentLeaderEndAt);
        }

        DeptLeader deptLeader = DeptLeader.appoint(this, emp, newStartAt);
        this.deptLeaders.add(deptLeader);

        return deptLeader;
    }

    public void endCurrentLeader(LocalDate endAt) {
        DeptLeader currentLeader = getCurrentLeader();
        if (currentLeader == null) {
            throw new IllegalStateException("현재 부서장이 없습니다.");
        }

        currentLeader.markEnd(endAt);
    }

    public @Nullable DeptLeader getCurrentLeader() {
        return this.deptLeaders.stream()
                .filter(DeptLeader::isCurrent)
                .findAny().orElse(null);
    }

    private boolean isCurrentMember(Emp emp) {
        return emp.getEmpBelongings().stream()
                .anyMatch(belonging ->
                        belonging.getEndAt() == null
                                && belonging.getDept().equals(this)
                );
    }

    private boolean isAllChildDeptsInactive() {
        return this.childDepts.stream()
                .allMatch(Dept::isAllTreeInactive);
    }

    private boolean isAllTreeInactive() {
        return !this.isActive && isAllChildDeptsInactive();
    }

    private boolean isDescendantOf(Dept ancestor) {
        Dept currentParent = this.parentDept;

        while (currentParent != null) {
            if (currentParent.equals(ancestor)) {
                return true;
            }

            currentParent = currentParent.parentDept;
        }

        return false;
    }

}
