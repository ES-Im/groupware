package com.haruon.groupware.application.empInfo.provided;


import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseParam;

/*
 * 전날의 근태기록을 마감.
 */
public interface AttendanceClosing {

    int closeAttendance(AttendanceCloseParam attendanceCloseParam);

}
