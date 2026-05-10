package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ApproveAttendanceByDeptManagerParam(
        Long approverId,

        Long targetEmpId,

        Long attendanceId,

        LocalDateTime approvedAt
) {

    public ApproveAttendanceByDeptManagerParam {
        if(approverId == null || targetEmpId == null || attendanceId == null || approvedAt == null) {
            throw new RequiredValueMissingException();
        }
    }

}
