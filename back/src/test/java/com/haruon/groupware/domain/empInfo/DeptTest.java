package com.haruon.groupware.domain.empInfo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.domain.fixture.EmpFixture.getDept;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeptTest {

    @Test
    @DisplayName("부서 생성 테스트")
    void dept_of_success() {
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
    void dept_of_fail() {
        // given
        String anyString = "00001";

        // when then
        assertThatThrownBy(() ->
                Dept.of(null, anyString)
        ).isInstanceOf(NullPointerException.class);

        assertThatThrownBy(() ->
                Dept.of(anyString, null)
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