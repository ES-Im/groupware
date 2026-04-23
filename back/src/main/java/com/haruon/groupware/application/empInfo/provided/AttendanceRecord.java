package com.haruon.groupware.application.empInfo.provided;

import java.time.LocalDateTime;

/**
 *  근태 마감 전, 사원이 본인의 출퇴근시각 기록
 */
public interface AttendanceRecord {

    void recordCheckIn(Long empId, LocalDateTime checkInAt);

    void recordCheckOut(Long empId, LocalDateTime checkOutAt);

    void rerecordEndAtByEmp(Long attendanceId, LocalDateTime checkOutAt);
}
