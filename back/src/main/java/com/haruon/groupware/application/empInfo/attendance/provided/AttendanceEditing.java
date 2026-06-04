package com.haruon.groupware.application.empInfo.attendance.provided;

import com.haruon.groupware.application.empInfo.attendance.service.dto.request.ApproveAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.EditAttendanceByDeptManagerRequest;

/** 근태 마감 후, 근태 수정 및 승인 */
public interface AttendanceEditing {

    void updateAttendanceByDeptManager(Long managerId, Long attendanceId, EditAttendanceByDeptManagerRequest param);

    void updateApproveAttendance(Long managerId, Long attendanceId, ApproveAttendanceByDeptManagerRequest param);

}
