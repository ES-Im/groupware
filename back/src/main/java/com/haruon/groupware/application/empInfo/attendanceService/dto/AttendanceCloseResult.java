package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.domain.empInfo.Attendance;

import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record AttendanceCloseResult(

        Attendance mainAttendance,

        List<Attendance> subAttendances

) {
    public AttendanceCloseResult {
        state(mainAttendance != null, "대표근태는 null일 수 없음");
        state(subAttendances != null, "추가 근태는 null일 수 없음");

        if(!subAttendances.isEmpty()) {
            subAttendances.forEach(s -> requireNonNull(s, "각 일정은 null이 될 수 없음"));
        }
    }
}
