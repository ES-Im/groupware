package com.haruon.groupware.application.employee.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.employee.leave.required.EmpLeaveRepository;
import com.haruon.groupware.application.employee.leave.service.command.LeaveCommandService;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.employee.leave.EmpAnnualLeaveNotFoundException;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.EmpLeave;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.employee.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record LeaveManagementTest(
        EmpLeaveRepository empLeaveRepository,
        LeaveCommandService leaveCommandService,
        EmpRepository empRepository,
        ScheduleRepository scheduleRepository
) {

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
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

        leaveCommandService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), 1.0);
        leaveCommandService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), 1.0);


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
                leaveCommandService.adjustSpecialGrantDays(notAdmin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(PermissionDeniedException.class);

        assertThatThrownBy(() ->
                leaveCommandService.adjustCompensatoryGrantDays(notAdmin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(PermissionDeniedException.class);

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
                leaveCommandService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), -1.0)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
                leaveCommandService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), -1.0)
        ).isInstanceOf(IllegalStateException.class);


    }

    @Test
    @DisplayName("대상 사원의 연차 정보가 없으면 특휴/포상휴가를 조정할 수 없다.")
    void adjust_special_grant_days_without_target_emp_leave_fail() {
        Emp admin = saveAdmin(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository);

        assertThatThrownBy(() ->
                leaveCommandService.adjustSpecialGrantDays(admin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(EmpAnnualLeaveNotFoundException.class);

        assertThatThrownBy(() ->
                leaveCommandService.adjustCompensatoryGrantDays(admin.getId(), targetEmp.getId(), 1.0)
        ).isInstanceOf(EmpAnnualLeaveNotFoundException.class);
    }



}
