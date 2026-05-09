package com.haruon.groupware.application.empInfo.provided;

/**
 * 매년 연차부여, 특별휴가/대체휴무 연차 조정
 */
public interface LeaveGrantManagement {

    /** return : 특별휴가 조정 결과*/
    void adjustSpecialGrantDays(long adminId, long empId, double plusMinusDays);

    /** return : 대체휴무 조정 결과*/
    void adjustCompensatoryGrantDays(long adminId, long empId, double plusMinusDays);

}
