package com.haruon.groupware.application.empInfo.leaveService;


public class LeaveCalculator {

//    double calculateTotalLeaveDays(
//            Emp emp, LocalDate grantedDate
//    ) {
//        LocalDate hiredAt = emp.getHiredAt();
//
//        state(hiredAt != null, "입사일자 값 없음");
//        state(!grantedDate.isBefore(hiredAt), "연차 부여일이 입사일보다 빠를 수 없음");
//
//        Period diff =  Period.between(hiredAt, grantedDate);
//        int yearsOfService = diff.getYears();
//
//        if (yearsOfService < 1) {
//            int completedMonths = calculateCompletedMonths(hiredAt, grantedDate);
//            return Math.min(completedMonths, 11);
//        }
//
//        return Math.min(
////                port.getDefaultAnnualLeaveDays() + Math.max(0, (yearsOfService - 1) / 2),
////                25
//        );
//    }
//
//    int calculateCompletedMonths(
//            LocalDate hiredAt, LocalDate grantedDate
//    ) {
//        int months = (grantedDate.getYear() - hiredAt.getYear()) * 12
//                + (grantedDate.getMonthValue() - hiredAt.getMonthValue());
//
//        if (grantedDate.getDayOfMonth() < hiredAt.getDayOfMonth()) {
//            months--;
//        }
//
//        return Math.max(months, 0);
//    }
}
