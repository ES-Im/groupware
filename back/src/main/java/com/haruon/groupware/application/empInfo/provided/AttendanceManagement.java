package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.domain.empInfo.Attendance;

import java.time.LocalDateTime;

/*
 * 근태 마감관련 외 근태 관리
 */
public interface AttendanceManagement {

    Attendance updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param);

    Attendance updateApproveAttendance(Long attendanceId, Long approverId, LocalDateTime approvedAt);

    Attendance updateEndAtByEmp(Long attendanceId, Long empId, LocalDateTime endAt);

}
