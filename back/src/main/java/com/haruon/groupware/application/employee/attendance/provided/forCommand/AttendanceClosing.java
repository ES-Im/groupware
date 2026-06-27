package com.haruon.groupware.application.employee.attendance.provided.forCommand;


import com.haruon.groupware.application.employee.attendance.service.command.dto.AttendanceCloseRequest;

/**전날의 근태기록을 마감. */
public interface AttendanceClosing {

    int closeAttendance(AttendanceCloseRequest attendanceCloseRequest);

}
