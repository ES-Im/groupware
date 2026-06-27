package com.haruon.groupware.domain.dept;

import com.haruon.groupware.domain.employee.Dept;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.domain.shared.DeptFixture.getDept;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeptTest {

    @Test
    @DisplayName("부서 생성 테스트")
    void dept_registerDept_success() {
        // when
        Dept dept = getDept();

        // then
        assertThat(dept).isNotNull();
        assertThat(dept.getDeptCode()).isNotNull();
        assertThat(dept.getDeptName()).isNotNull();
        assertThat(dept.isActive()).isTrue();
    }

    @Test
    @DisplayName("부서 생성 테스트 - 실패")
    void dept_registerDept_fail() {
        // given
        String anyString = "00001";

        // when then
        assertThatThrownBy(() ->
                Dept.registerDept(null, anyString)
        ).isInstanceOf(NullPointerException.class);

        assertThatThrownBy(() ->
                Dept.registerDept(anyString, null)
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("부서 비활성화/활성화 테스트 - 성공")
    void dept_activation_success() {
        //when then
        Dept dept = getDept();
        dept.deactivate();
        dept.activate();
    }

    @Test
    @DisplayName("부서 활성화 테스트 - 실패")
    void dept_activation_fail() {
        //when
        Dept dept = getDept();

        //then
        assertThatThrownBy(dept::activate).isInstanceOf(IllegalStateException.class)
                .hasMessage("이미 활성화된 부서입니다.");
    }

    @Test
    @DisplayName("부서 비활성화 테스트 - 실패")
    void dept_deactivate_fail() {
        // given
        Dept dept = getDept();
        dept.deactivate();

        //then
        assertThatThrownBy(dept::deactivate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("이미 비활성화된 부서입니다.");
    }

    @Test
    @DisplayName("활성 하위 부서가 있으면 상위 부서를 비활성화할 수 없다")
    void deactivate_parent_dept_with_active_child_fail() {
        // given
        Dept parent = getDept("001", "parentDept");
        Dept child = getDept("002", "childDept");
        child.changeParent(parent);

        // when then
        assertThatThrownBy(parent::deactivate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("상위 부서를 비활성화하려면 하위 부서가 모두 비활성화되어야 합니다.");
    }

    @Test
    @DisplayName("하위 부서가 모두 비활성화되어 있으면 상위 부서를 비활성화할 수 있다")
    void deactivate_parent_dept_with_inactive_children_success() {
        // given
        Dept parent = getDept("001", "parentDept");
        Dept child = getDept("002", "childDept");
        child.changeParent(parent);
        child.deactivate();

        // when
        parent.deactivate();

        // then
        assertThat(parent.isActive()).isFalse();
    }

    @Test
    @DisplayName("상위 부서가 비활성화되어 있으면 하위 부서를 활성화할 수 없다")
    void activate_child_dept_with_inactive_parent_fail() {
        // given
        Dept parent = getDept("001", "parentDept");
        Dept child = getDept("002", "childDept");
        child.changeParent(parent);
        child.deactivate();
        parent.deactivate();

        // when then
        assertThatThrownBy(child::activate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("상위 부서가 활성화되어야 하위 부서를 활성화할 수 있습니다.");
    }

    @Test
    @DisplayName("하위 부서의 상위 부서를 변경할 수 있다")
    void change_parent_dept_success() {
        // given
        Dept oldParent = getDept("001", "oldParentDept");
        Dept newParent = getDept("002", "newParentDept");
        Dept child = getDept("003", "childDept");
        child.changeParent(oldParent);

        // when
        child.changeParent(newParent);

        // then
        assertThat(child.getParentDept()).isEqualTo(newParent);
        assertThat(oldParent.getChildDepts()).doesNotContain(child);
        assertThat(newParent.getChildDepts()).contains(child);
    }

    @Test
    @DisplayName("하위 부서를 상위 부서로 지정할 수 없다")
    void change_parent_dept_to_child_fail() {
        // given
        Dept parent = getDept("001", "parentDept");
        Dept child = getDept("002", "childDept");
        Dept grandChild = getDept("003", "grandChildDept");
        child.changeParent(parent);
        grandChild.changeParent(child);

        // when then
        assertThatThrownBy(() -> parent.changeParent(grandChild))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("하위 부서를 상위 부서로 지정할 수 없습니다.");
    }

    @Test
    @DisplayName("부서 이름 변경 테스트 - 성공")
    void rename_dept_success() {
        // given
        Dept dept = getDept();

        // when then
        dept.renameDept("newDeptName");
    }

    @Test
    @DisplayName("부서 이름 변경 테스트 - 실패")
    void rename_dept_fail() {
        // given
        Dept dept = getDept();

        // when then
        assertThatThrownBy(() ->
                dept.renameDept(null)
        ).isInstanceOf(NullPointerException.class);
    }
}
