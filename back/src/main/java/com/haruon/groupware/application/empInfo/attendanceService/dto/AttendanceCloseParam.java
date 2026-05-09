package com.haruon.groupware.application.empInfo.attendanceService.dto;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;

public record AttendanceCloseParam(

        Long empId,

        LocalDate attendanceDate

) {
    public AttendanceCloseParam {
        requireNonNull(attendanceDate, "근태 기준 날짜는 null일 수 없음");
        requireNonNull(empId, "사원정보가 없음");
    }
}