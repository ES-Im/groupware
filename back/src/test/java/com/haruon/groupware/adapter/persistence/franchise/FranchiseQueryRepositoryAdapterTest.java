package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.franchise.required.FranchiseQueryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.query.dto.AssignableManagerResponse;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveEmpWithDept;
import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
@Transactional
record FranchiseQueryRepositoryAdapterTest(
        FranchiseQueryRepository franchiseQueryRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository
) {

    private static final AtomicInteger EMP_NO = new AtomicInteger(710000);

    @BeforeEach
    void setUp() {
        clean();
    }

    @AfterEach
    void tearDown() {
        clean();
    }

    @Test
    @DisplayName("배정 후보 조회 - FRANCHISE 권한 ACTIVE 사원만 포함하고 비FRANCHISE 사원은 제외한다")
    void findAssignableManagers_onlyFranchiseRole() {
        Emp franchiseA = saveFranchiseEmp("assignable-a");
        Emp franchiseB = saveFranchiseEmp("assignable-b");
        Emp employee = saveNonFranchiseEmp("assignable-emp");

        List<AssignableManagerResponse> responses = franchiseQueryRepository.findAssignableManagers();

        assertThat(responses)
                .extracting(AssignableManagerResponse::empId)
                .contains(franchiseA.getId(), franchiseB.getId())
                .doesNotContain(employee.getId());
        assertThat(responses)
                .extracting(AssignableManagerResponse::empName)
                .contains(franchiseA.getEmpName(), franchiseB.getEmpName());
    }

    private void clean() {
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    private Emp saveFranchiseEmp(String loginId) {
        return getSavedFranchiseEmp(
                deptRepository,
                empRepository,
                String.valueOf(EMP_NO.incrementAndGet()),
                loginId
        );
    }

    private Emp saveNonFranchiseEmp(String loginId) {
        Dept dept = deptRepository.findByDeptCode("001")
                .orElseGet(() -> deptRepository.save(Dept.registerDept("001", "Franchise")));

        return saveEmpWithDept(
                empRepository,
                deptRepository,
                String.valueOf(EMP_NO.incrementAndGet()),
                loginId,
                dept
        );
    }
}
