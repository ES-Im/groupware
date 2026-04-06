package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.domain.empInfo.Emp;

import java.time.LocalDate;
import java.util.List;

/**
 * 매년 연차부여, 특별휴가/대체휴무 연차 조정
 */
public interface LeaveGrantManagement {

    /** return : 특별휴가 조정 결과*/
    int adjustSpecialGrantDays(long empId, double plusMinusDays);

    /** return : 대체휴무 조정 결과*/
    int adjustCompensatoryGrantDays(long empId, double plusMinusDays);

    /** return : 연차 부여된 사원의 총 인원 (매년 1회)*/
    int grantAnnualLeaveForYear(List<Emp> empList, LocalDate grantedDate);
}
