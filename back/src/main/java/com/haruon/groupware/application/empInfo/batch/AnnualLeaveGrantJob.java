package com.haruon.groupware.application.empInfo.batch;

// to-do 매년 사원 연차 부여 JOB
public class AnnualLeaveGrantJob {


//    // to-do 배치 처리 대상 메서드 : RESIGNED 제외 필터링 필요
//    public int grantAnnualLeaveForNewYear(List<Emp> empList, LocalDate grantedDate) {
//        requireNonNull(empList, "사원 목록은 null일 수 없음");
//        state(!empList.isEmpty(), "사원 목록은 빈값이 될 수 없음");
//        requireNonNull(grantedDate, "연차 부여일은 null일 수 없음");
//
//        int grantedYear = grantedDate.getYear();
//
//        List<EmpLeave> empLeaves = new ArrayList<>();
//
//        empList.forEach(emp -> {
//            double grantedLeaveDays = calculateTotalLeaveDays(companyPolicyPort, emp, grantedDate);
//            empLeaves.add(createEmpLeave(emp, grantedYear, grantedLeaveDays));
//        });
//
//        if (empLeaves.isEmpty()) return 0;
//
//        return empLeaveRepository.saveAll(empLeaves).size();
//    }


}
