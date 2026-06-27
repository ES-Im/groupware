package com.haruon.groupware.domain.dept;

import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.DeptLeader;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.PositionCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.DeptFixture.getDept;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmpWithoutDept;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeptLeaderTest {

    @Test
    @DisplayName("현재 해당 부서 소속 사원을 부서장으로 지정할 수 있다")
    void appoint_success() {
        Dept dept = getDept();
        Emp emp = getApprovedEmpWithoutDept("202601001", "leader");
        emp.changeBelongingsByHR(
                dept,
                PositionCode.MANAGER,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );

        DeptLeader deptLeader = dept.appointLeader(emp, LocalDate.of(2026, 2, 1));

        assertThat(deptLeader.getDept()).isEqualTo(dept);
        assertThat(deptLeader.getEmp()).isEqualTo(emp);
        assertThat(deptLeader.getStartAt()).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(deptLeader.getEndAt()).isNull();
        assertThat(deptLeader.isCurrent()).isTrue();
        assertThat(dept.getDeptLeaders()).contains(deptLeader);
    }

    @Test
    @DisplayName("현재 해당 부서 소속이 아니면 부서장으로 지정할 수 없다")
    void appoint_fail_when_emp_is_not_current_member_of_dept() {
        Dept dept = getDept("001", "인사팀");
        Emp emp = getApprovedEmp("202601001", "leader");

        assertThatThrownBy(() -> dept.appointLeader(emp, LocalDate.of(2026, 2, 1)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("부서장은 해당 부서의 현재 소속 사원이어야 합니다.");
    }

    @Test
    @DisplayName("부서장 종료일은 시작일보다 빠를 수 없다")
    void mark_end_fail_when_end_at_is_before_start_at() {
        Dept dept = getDept();
        Emp emp = getApprovedEmpWithoutDept("202601001", "leader");
        emp.changeBelongingsByHR(
                dept,
                PositionCode.MANAGER,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );
        dept.appointLeader(emp, LocalDate.of(2026, 2, 1));

        assertThatThrownBy(() -> dept.endCurrentLeader(LocalDate.of(2026, 1, 31)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("부서장 종료일은 시작일보다 빠를 수 없습니다.");
    }

    @Test
    @DisplayName("종료된 부서장 이력은 다시 종료할 수 없다")
    void mark_end_fail_when_already_ended() {
        Dept dept = getDept();
        Emp emp = getApprovedEmpWithoutDept("202601001", "leader");
        emp.changeBelongingsByHR(
                dept,
                PositionCode.MANAGER,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );
        dept.appointLeader(emp, LocalDate.of(2026, 2, 1));
        dept.endCurrentLeader(LocalDate.of(2026, 3, 1));

        assertThatThrownBy(() -> dept.endCurrentLeader(LocalDate.of(2026, 3, 2)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("현재 부서장이 없습니다.");
    }

    @Test
    @DisplayName("새 부서장을 지정하면 기존 현재 부서장 이력은 종료된다")
    void appoint_replaces_current_leader() {
        Dept dept = getDept();
        Emp firstLeader = getApprovedEmpWithoutDept("202601001", "leader1");
        firstLeader.changeBelongingsByHR(
                dept,
                PositionCode.MANAGER,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );
        Emp nextLeader = getApprovedEmpWithoutDept("202601002", "leader2");
        nextLeader.changeBelongingsByHR(
                dept,
                PositionCode.SENIOR_MANAGER,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );

        DeptLeader first = dept.appointLeader(firstLeader, LocalDate.of(2026, 2, 1));
        DeptLeader next = dept.appointLeader(nextLeader, LocalDate.of(2026, 3, 1));

        assertThat(first.getEndAt()).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(next.isCurrent()).isTrue();
        assertThat(dept.getDeptLeaders()).contains(next);
    }
}
