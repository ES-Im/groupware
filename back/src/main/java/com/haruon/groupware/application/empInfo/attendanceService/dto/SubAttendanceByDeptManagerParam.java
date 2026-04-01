package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import lombok.Builder;

import java.time.LocalTime;

import static org.springframework.util.Assert.state;

@Builder
public record SubAttendanceByDeptManagerParam(
        LocalTime startAt,
        LocalTime endAt,

        AttendanceStatus status
) {
    public SubAttendanceByDeptManagerParam {
        state(startAt != null, "서브 근태 시작시각 필수");
        state(endAt != null, "서브 근태 종료시각 필수");
        state(status != null, "서브 근태 상태 필수");
        state(!endAt.isBefore(startAt), "서브 근태 종료시각은 시작시각보다 빠를 수 없음");
    }
}
