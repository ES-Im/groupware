package com.haruon.groupware.application.employee.attendance.provided.forCommand;

import com.haruon.groupware.application.employee.attendance.service.command.dto.ApproveAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.employee.attendance.service.command.dto.EditAttendanceByDeptManagerRequest;

/** 근태 마감 후, 근태 수정 및 승인 */
public interface AttendanceEditing {

    void updateAttendanceByDeptManager(Long managerId, Long attendanceId, EditAttendanceByDeptManagerRequest param);

    void updateApproveAttendance(Long managerId, Long attendanceId, ApproveAttendanceByDeptManagerRequest param);

}
