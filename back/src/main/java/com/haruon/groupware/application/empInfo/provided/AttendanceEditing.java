package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.attendanceService.dto.ApproveAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;

/** 근태 마감 후, 근태 수정 및 승인 */
public interface AttendanceEditing {

    void updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param);

    void updateApproveAttendance(ApproveAttendanceByDeptManagerParam param);

}
