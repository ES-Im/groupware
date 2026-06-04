package com.haruon.groupware.application.empInfo.attendance.provided;


import com.haruon.groupware.application.empInfo.attendance.service.dto.request.AttendanceCloseRequest;

/**전날의 근태기록을 마감. */
public interface AttendanceClosing {

    /** @return 각 사원별 마감된 근태 기록 수*/
    int closeAttendance(AttendanceCloseRequest attendanceCloseRequest);

}
