package com.haruon.groupware.application.empInfo.attendanceService.dto;

import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

@Builder
public record ApproveAttendanceByDeptManagerParam(
        Long approverId,

        Long targetEmpId,

        Long attendanceId,

        LocalDateTime approvedAt
) {

    public ApproveAttendanceByDeptManagerParam {
        requireNonNull(targetEmpId, "수정대상 사원번호 필수");
        requireNonNull(approvedAt, "승인시각 필수");
        requireNonNull(attendanceId, "승인자 필수");
        requireNonNull(attendanceId, "승인대상 근태 번호 필수");
    }

}
