package com.haruon.groupware.application.empInfo.provided;

import java.time.LocalDateTime;

/**
 *  사원이 본인의 출퇴근시각 기록
 */
public interface AttendanceRecord {

    /** return : 출근처리 성공여부 */
    int recordCheckIn(Long empId, LocalDateTime checkInAt);

    /** return : 퇴근 처리 성공여부 */
    int recordCheckOut(Long empId, LocalDateTime checkOutAt);
}
