package com.haruon.groupware.application.empInfo.leaveService;


import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public class LeaveCalculator {

    protected static double calculateTotalLeaveDays(
            CompanyPolicyPort port,
            Emp emp,
            LocalDate grantedDate
    ) {
        LocalDate hiredAt = emp.getHiredAt();

        state(hiredAt != null, "입사일자 값 없음");
        requireNonNull(grantedDate, "연차 부여일자 값 없음");
        state(!grantedDate.isBefore(hiredAt), "연차 부여일이 입사일보다 빠를 수 없음");

        int grantYear = grantedDate.getYear(), hireYear = hiredAt.getYear();

        if (grantYear != hireYear) {
            state(isFirstDayOfYear(grantedDate), "신입 연차 부여 외, 연차 부여일은 매년 1월 1일이어야 함");

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

    private static boolean isFirstDayOfYear(LocalDate date) {
        return date.getMonthValue() == 1 && date.getDayOfMonth() == 1;
    }
}
