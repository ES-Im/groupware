package com.haruon.groupware.application.empInfo.leaveService;

import com.haruon.groupware.application.empInfo.provided.LeaveUse;
import com.haruon.groupware.application.empInfo.required.LeaveRepository;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@Transactional
@RequiredArgsConstructor
public class LeaveUseService implements LeaveUse {

    private final LeaveRepository leaveRepository;

    @Override
    public int useAnnualDays(long empId, double usedDays) {
        EmpLeave empLeave = getEmpLeave(empId);

        return empLeave.useAnnualDays(usedDays);
    }

    @Override
    public int useSpecialDays(long empId, double usedDays) {
        EmpLeave empLeave = getEmpLeave(empId);

        return empLeave.useSpecialDays(usedDays);
    }

    @Override
    public int useCompensatoryDays(long empId, double usedDays) {
        EmpLeave empLeave = getEmpLeave(empId);

        return empLeave.useCompensatoryDays(usedDays);
    }

    private EmpLeave getEmpLeave(long empId) {
        int thisYear = LocalDate.now().getYear();
        return leaveRepository.findByEmpIdAndGrantYear(empId, thisYear)
                .orElseThrow(() ->
                        new RuntimeException("대상 연차정보가 없음")     // to-do 커스텀 예외처리 필요
                );
    }
}
