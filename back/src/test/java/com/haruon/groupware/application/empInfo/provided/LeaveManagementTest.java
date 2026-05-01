package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.leaveService.LeaveManagementService;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record LeaveManagementTest(
        EmpLeaveRepository empLeaveRepository,
        LeaveManagementService leaveManagementService,
        EmpRepository empRepository
) {

    @AfterEach
    void tearDown() {
        empLeaveRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Test
    @DisplayName("ADMIN은 각 사원의 특휴/포상휴가를 조정할 수 있다.")
    void adjust_special_grant_days_by_admin() {
        Emp admin = saveAdmin(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository);
        int thisYear = LocalDate.now().getYear();
        EmpLeave empLeave = createEmpLeave(targetEmp, thisYear, 15);
        empLeaveRepository.save(empLeave);

        leaveManagementService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), 1.0);
        leaveManagementService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), 1.0);


        EmpLeave foundLeave = empLeaveRepository.findByEmpIdAndGrantYear(targetEmp.getId(), thisYear)
                .orElseThrow();

        assertThat(foundLeave.getSpecialGrantDays()).isOne();
        assertThat(foundLeave.getCompensatoryGrantDays()).isOne();
    }

    @Test
    @DisplayName("ADMIN 외에는 각 사원의 특휴/포상휴가를 조정할 수 없다.")
    void adjust_special_grant_days_not_by_admin_fail() {
        Emp notAdmin = saveApprovedEmp(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository, "202601003", "approvedEmp3");
        int thisYear = LocalDate.now().getYear();
        EmpLeave empLeave = createEmpLeave(targetEmp, thisYear, 15);
        empLeaveRepository.save(empLeave);


        assertThatThrownBy(() ->
                leaveManagementService.adjustSpecialGrantDays(notAdmin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
                leaveManagementService.adjustCompensatoryGrantDays(notAdmin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(IllegalStateException.class);

    }


    @Test
    @DisplayName("특휴/포상휴가를 조정할 수 있다.")
    void negative_after_adjust_special_grant_days_fail() {
        Emp admin = saveAdmin(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository);
        int thisYear = LocalDate.now().getYear();
        EmpLeave empLeave = createEmpLeave(targetEmp, thisYear, 15);
        empLeaveRepository.save(empLeave);

        assertThatThrownBy(() ->
                leaveManagementService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), -1.0)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
                leaveManagementService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), -1.0)
        ).isInstanceOf(IllegalStateException.class);


    }

    @Test
    @DisplayName("대상 사원의 연차 정보가 없으면 특휴/포상휴가를 조정할 수 없다.")
    void adjust_special_grant_days_without_target_emp_leave_fail() {
        Emp admin = saveAdmin(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository);

        assertThatThrownBy(() ->
                leaveManagementService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
                leaveManagementService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(IllegalStateException.class);
    }



}
