package com.haruon.groupware.application.employee.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.provided.forCommand.DeptManagement;
import com.haruon.groupware.application.dept.provided.forRetriever.DeptRetriever;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.dept.service.command.dto.DeptRegisterRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.employee.dept.DuplicateDeptException;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.DeptLeader;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record DeptManagementTest(
        DeptManagement deptManagement,
        DeptRetriever deptRetriever,
        DeptRepository deptRepository,
        EmpRepository empRepository,
        EntityManager entityManager,
        PlatformTransactionManager transactionManager
) {

    @BeforeEach
    void setUp() {
        cleanDatabase();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            return;
        }

        System.out.println("===== deleteAll =====");
        cleanDatabase();
    }

    private void cleanDatabase() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        transactionTemplate.executeWithoutResult(status -> {
            entityManager.createQuery("delete from DeptLeader").executeUpdate();
            entityManager.createQuery("update Dept d set d.parentDept = null").executeUpdate();
            entityManager.clear();
            empRepository.deleteAll();
            deptRepository.deleteAll();
        });
    }

    @Test
    @DisplayName("ADMIN은 부서를 생성할 수 있다")
    void registerDept_success() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(admin.getId(), request);

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
        DeptRegisterRequest request = DeptRegisterRequest.builder().deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(admin.getId(), request);

        assertThatThrownBy(() ->
                deptManagement.registerDept(admin.getId(), request)
        ).isInstanceOf(DuplicateDeptException.class);
    }

    @Test
    @DisplayName("일반 사원은 부서를 생성할 수 없다.")
    void registerDept_by_emp_fail() {
        Emp emp = saveApprovedEmp(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().deptCode(deptCode).deptName(deptName).build();

        assertThatThrownBy(() -> deptManagement.registerDept(emp.getId(), request))
                .isInstanceOf(PermissionDeniedException.class);
    }

    @Transactional
    @TestFactory
    @DisplayName("ADMIN은 부서 활성화여부, 부서명 관리를 할 수 있다.")
    Collection<DynamicTest> update_dept_info_by_admin_success() {
        Emp admin = saveAdmin(empRepository);

        String deptCode = "002";
        String deptName = "IT";
        DeptRegisterRequest request = DeptRegisterRequest.builder().deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(admin.getId(), request);

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
        DeptRegisterRequest request = DeptRegisterRequest.builder().deptCode(deptCode).deptName(deptName).build();
        deptManagement.registerDept(admin.getId(), request);

        Emp emp = saveApprovedEmp(empRepository);

        Emp foundEmp = empRepository.findByEmpNo(emp.getEmpNo()).orElseThrow();
        Dept foundDept = deptRepository.findByDeptCode(deptCode).orElseThrow();

        assertThatThrownBy(() -> {
            String newDeptName = "IT2";
            deptManagement.updateDeptName(foundDept.getId(), newDeptName, foundEmp.getId());
        }).isInstanceOf(PermissionDeniedException.class);

        assertThatThrownBy(() -> {
            deptManagement.deactivate(foundDept.getId(), foundEmp.getId());
        }).isInstanceOf(PermissionDeniedException.class);

        assertThatThrownBy(() -> {
            deptManagement.activate(foundDept.getId(), foundEmp.getId());
        }).isInstanceOf(PermissionDeniedException.class);
    }

    @Transactional
    @Test
    @DisplayName("ADMIN은 하위 부서의 상위 부서를 변경할 수 있다")
    void change_parent_dept_by_admin_success() {
        Emp admin = saveAdmin(empRepository);
        Dept oldParent = deptRepository.save(Dept.registerDept("001", "oldParent"));
        Dept newParent = deptRepository.save(Dept.registerDept("002", "newParent"));
        Dept child = deptRepository.save(Dept.registerDept("003", "child"));
        child.changeParent(oldParent);

        deptManagement.changeParentDept(child.getId(), newParent.getId(), admin.getId());

        assertThat(child.getParentDept()).isEqualTo(newParent);
        assertThat(oldParent.getChildDepts()).doesNotContain(child);
        assertThat(newParent.getChildDepts()).contains(child);
    }

    @Transactional
    @Test
    @DisplayName("일반사원은 하위 부서의 상위 부서를 변경할 수 없다")
    void change_parent_dept_by_emp_fail() {
        Emp emp = saveApprovedEmp(empRepository);
        Dept parent = deptRepository.save(Dept.registerDept("001", "parent"));
        Dept child = deptRepository.save(Dept.registerDept("002", "child"));

        assertThatThrownBy(() -> deptManagement.changeParentDept(child.getId(), parent.getId(), emp.getId()))
                .isInstanceOf(PermissionDeniedException.class);
    }

    @Transactional
    @Test
    @DisplayName("ADMIN은 현재 부서 소속 사원을 부서장으로 지정할 수 있다")
    void appoint_dept_leader_success() {
        Emp admin = saveAdmin(empRepository);
        Dept dept = deptRepository.save(Dept.registerDept("002", "IT"));
        Emp leader = saveEmpWithDept(empRepository, deptRepository, "202601010", "leader", dept);

        deptManagement.appointLeader(
                dept.getId(),
                leader.getId(),
                LocalDate.of(2026, 2, 1),
                admin.getId()
        );

        Dept foundDept = deptRepository.findById(dept.getId()).orElseThrow();

        assertThat(foundDept.getCurrentLeader())
                .satisfies(currentLeader -> {
                    assertThat(currentLeader.getEmp()).isEqualTo(leader);
                    assertThat(currentLeader.getStartAt()).isEqualTo(LocalDate.of(2026, 2, 1));
                });

    }

    @Transactional
    @Test
    @DisplayName("ADMIN은 현재 부서장 이력을 종료할 수 있다")
    void end_current_dept_leader_success() {
        Emp admin = saveAdmin(empRepository);
        Dept dept = deptRepository.save(Dept.registerDept("002", "IT"));
        Emp leader = saveEmpWithDept(empRepository, deptRepository, "202601010", "leader", dept);
        deptManagement.appointLeader(
                dept.getId(),
                leader.getId(),
                LocalDate.of(2026, 2, 1),
                admin.getId()
        );

        deptManagement.endCurrentLeader(
                dept.getId(),
                LocalDate.of(2026, 3, 1),
                admin.getId()
        );

        Dept foundDept = deptRepository.findById(dept.getId()).orElseThrow();

        assertThat(foundDept.getCurrentLeader()).isNull();
        assertThat(foundDept.getDeptLeaders())
                .singleElement()
                .extracting(DeptLeader::getEndAt)
                .isEqualTo(LocalDate.of(2026, 3, 1));
    }

}
