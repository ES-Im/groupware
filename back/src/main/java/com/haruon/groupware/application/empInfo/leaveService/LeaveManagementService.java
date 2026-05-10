package com.haruon.groupware.application.empInfo.leaveService;

import com.haruon.groupware.application.empInfo.provided.LeaveGrantManagement;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.EmpAnnualLeaveNotFoundException;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

import static com.haruon.groupware.application.utils.AuthorizationChecker.checkAdminById;

@Service
@Transactional
@RequiredArgsConstructor
public class LeaveManagementService extends LeaveCalculator implements LeaveGrantManagement {

    private final EmpLeaveRepository empLeaveRepository;
    private final EmpRepository empRepository;

    @Override
    public void adjustSpecialGrantDays(long adminId, long empId, double plusMinusDays) {
        checkAdminById(empRepository, adminId);

        EmpLeave empLeave = getEmpLeave(empId);
        empLeave.adjustSpecialGrantDays(plusMinusDays);
    }

    @Override
    public void adjustCompensatoryGrantDays(long adminId, long empId, double plusMinusDays) {
        checkAdminById(empRepository, adminId);

        EmpLeave empLeave = getEmpLeave(empId);
        empLeave.adjustCompensatoryGrantDays(plusMinusDays);
    }

    private EmpLeave getEmpLeave(long empId) {
        int thisYear = LocalDate.now(ZoneId.systemDefault()).getYear();
        return empLeaveRepository.findByEmpIdAndGrantYear(empId, thisYear)
                .orElseThrow(EmpAnnualLeaveNotFoundException::new);
    }


}
