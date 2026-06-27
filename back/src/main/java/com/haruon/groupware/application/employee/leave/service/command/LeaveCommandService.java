package com.haruon.groupware.application.employee.leave.service.command;

import com.haruon.groupware.application.employee.leave.provided.forCommand.LeaveGrantManagement;
import com.haruon.groupware.application.employee.leave.required.EmpLeaveRepository;
import com.haruon.groupware.application.employee.leave.service.support.LeaveCalculator;
import com.haruon.groupware.application.exception.employee.leave.EmpAnnualLeaveNotFoundException;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.employee.EmpLeave;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

import static com.haruon.groupware.application.utils.AuthValidator.checkAdminById;

@Service
@Transactional
@RequiredArgsConstructor
public class LeaveCommandService extends LeaveCalculator implements LeaveGrantManagement {

    private final EmpLeaveRepository empLeaveRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public void adjustSpecialGrantDays(long adminId, long empId, double plusMinusDays) {
        checkAdminById(authorizationQueryRepository, adminId);

        EmpLeave empLeave = getEmpLeave(empId);
        empLeave.adjustSpecialGrantDays(plusMinusDays);
    }

    @Override
    public void adjustCompensatoryGrantDays(long adminId, long empId, double plusMinusDays) {
        checkAdminById(authorizationQueryRepository, adminId);

        EmpLeave empLeave = getEmpLeave(empId);
        empLeave.adjustCompensatoryGrantDays(plusMinusDays);
    }

    private EmpLeave getEmpLeave(long empId) {
        int thisYear = LocalDate.now(ZoneId.systemDefault()).getYear();
        return empLeaveRepository.findByEmpIdAndGrantYear(empId, thisYear)
                .orElseThrow(EmpAnnualLeaveNotFoundException::new);
    }


}
