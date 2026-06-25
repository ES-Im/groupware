package com.haruon.groupware.application.empInfo.attendance.provided;


import com.haruon.groupware.application.empInfo.attendance.service.dto.request.AttendanceCloseRequest;

/**전날의 근태기록을 마감. */
public interface AttendanceClosing {

    int closeAttendance(AttendanceCloseRequest attendanceCloseRequest);

}
