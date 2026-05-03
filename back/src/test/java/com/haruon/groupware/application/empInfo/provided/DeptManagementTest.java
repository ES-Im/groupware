package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.deptService.DeptRegisterRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.*;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Collection;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record DeptManagementTest(
        DeptManagement deptManagement,
        DeptRepository deptRepository,
        EmpRepository empRepository,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        System.out.println("===== deleteAll =====");
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("ADMIN은 부서를 생성할 수 있다")
    void registerDept_success() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().adminId(admin.getId()).deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(request);

        deptRepository.findByDeptCode(deptCode).ifPresent(dept -> {
            assertThat(dept.isActive()).isTrue();
            assertThat(dept.getDeptCode()).isEqualTo(deptCode);
            assertThat(dept.getDeptName()).isEqualTo(deptName);
            assertThat(dept.getId()).isNotNull();
        });
    }

    @Test
    @DisplayName("ADMIN은 이미 있는 부서 ID로 부서를 생성할 수 있다")
    void registerDept_with_duplicate_id_fail() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().adminId(admin.getId()).deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(request);

        assertThatThrownBy(() ->
                deptManagement.registerDept(request)
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("일반 사원은 부서를 생성할 수 없다.")
    void registerDept_by_emp_fail() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().adminId(admin.getId()).deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(request);
    }

    @Transactional
    @TestFactory
    @DisplayName("ADMIN은 부서 활성화여부, 부서명 관리를 할 수 있다.")
    Collection<DynamicTest> update_dept_info_by_admin_success() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().adminId(admin.getId()).deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(request);

        Emp foundEmp = empRepository.findByEmpNo(admin.getEmpNo()).orElseThrow();
        Dept foundDept = deptRepository.findByDeptCode(deptCode).orElseThrow();

        return List.of(DynamicTest.dynamicTest(
                    "ADMIN은 부서를 비활성화 할 수 있다.", () -> {
                    deptManagement.deactivate(foundDept.getId(), foundEmp.getId());

                    assertThat(foundDept.isActive()).isFalse();
                }), DynamicTest.dynamicTest(
                    "ADMIN은 부서를 활성화 할 수 있다.", () -> {
                    deptManagement.activate(foundDept.getId(), foundEmp.getId());

                    assertThat(foundDept.isActive()).isTrue();
                }), DynamicTest.dynamicTest(
                    "ADMIN은 부서의 이름을 정정할 수 있다", () -> {
                        String newDeptName = "IT2";
                        deptManagement.updateDeptName(foundDept.getId(), newDeptName, foundEmp.getId());

                        assertThat(foundDept.getDeptName()).isEqualTo(newDeptName);
                })
        );
    }


    @Test
    @DisplayName("일반사원은 부서 활성화여부, 부서명 관리를 할 수 없다.")
    void update_dept_info_by_emp_fail() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().adminId(admin.getId()).deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(request);

        Emp emp = saveApprovedEmp(empRepository);

        Emp foundEmp = empRepository.findByEmpNo(emp.getEmpNo()).orElseThrow();
        Dept foundDept = deptRepository.findByDeptCode(deptCode).orElseThrow();

        assertThatThrownBy(() -> {
            String newDeptName = "IT2";
            deptManagement.updateDeptName(foundDept.getId(), newDeptName, foundEmp.getId());
        }).hasMessage("권한이 없습니다.");

        assertThatThrownBy(() -> {
            deptManagement.deactivate(foundDept.getId(), foundEmp.getId());
        }).hasMessage("권한이 없습니다.");

        assertThatThrownBy(() -> {
            deptManagement.activate(foundDept.getId(), foundEmp.getId());
        }).hasMessage("권한이 없습니다.");
    }

}