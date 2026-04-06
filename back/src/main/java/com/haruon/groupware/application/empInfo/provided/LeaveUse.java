package com.haruon.groupware.application.empInfo.provided;

/**
 * 연가/특휴/대휴 사용
 */
public interface LeaveUse {

    /** return : 연차 사용 성공여부 */
    int useAnnualDays(long empId, double usedDays);

    /** return : 특휴 사용 성공여부 */
    int useSpecialDays(long empId, double usedDays);

    /** return : 대휴 사용 성공여부 */
    int useCompensatoryDays(long empId, double usedDays);

}
