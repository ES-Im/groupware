package com.haruon.groupware.application.empInfo.leaveService;


import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.empInfo.GrantedDateBeforeHiredDateException;
import com.haruon.groupware.application.exception.empInfo.InvalidAnnualLeaveGrantedDateException;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class LeaveCalculator {

    protected static double calculateTotalLeaveDays(
            CompanyPolicyPort port,
            Emp emp,
            LocalDate grantedDate
    ) {
        LocalDate hiredAt = emp.getHiredAt();

        if(hiredAt == null || grantedDate == null) throw new RequiredValueMissingException();
        if(grantedDate.isBefore(hiredAt)) throw new GrantedDateBeforeHiredDateException();

        int grantYear = grantedDate.getYear(), hireYear = hiredAt.getYear();

        if (grantYear != hireYear) {
            if(grantedDate.getMonthValue() != 1 || grantedDate.getDayOfMonth() != 1) {
                throw new InvalidAnnualLeaveGrantedDateException();
            }

            return calculateLeaveDaysForNewYear(port, grantYear, hireYear);
        }

            return calculateLeaveDaysForHiredInThisYear(hiredAt);
    }

    private static long calculateLeaveDaysForHiredInThisYear(LocalDate hiredAt) {
        LocalDate firstDayOfNextYear = LocalDate.of(hiredAt.getYear() + 1, 1, 1);
        long completedMonths = ChronoUnit.MONTHS.between(hiredAt, firstDayOfNextYear);
        return Math.min(completedMonths, 11);
    }

    private static double calculateLeaveDaysForNewYear(CompanyPolicyPort port, int grantYear, int hireYear) {
        int yearsOfService = grantYear - hireYear;

        double defaultAnnualLeaveDays = port.getDefaultAnnualLeaveDays();
        double maxAnnualLeaveDays = port.getMaxAnnualLeaveDays();

        return Math.min(
                defaultAnnualLeaveDays + Math.max(0, (yearsOfService - 1) / 2),
                maxAnnualLeaveDays
        );
    }

}
