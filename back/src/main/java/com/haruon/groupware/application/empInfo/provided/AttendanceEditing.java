package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;

import java.time.LocalDateTime;

/** 근태 마감관련 외 근태 관리 */
public interface AttendanceEditing {
    /** @return 각 사원별 편집된 근태 기록 수*/
    int updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param);

    /** @return 각 사원별 편집된 근태 기록 수*/
    int updateApproveAttendance(Long attendanceId, Long approverId, LocalDateTime approvedAt);

    /** @return 각 사원별 편집된 근태 기록 수*/
    int updateEndAtByEmp(Long attendanceId, Long empId, LocalDateTime endAt);

}
