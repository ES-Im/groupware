package com.haruon.groupware.domain.empInfo.dto;

import com.haruon.groupware.domain.empInfo.EmpAttendance;

import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record AttendanceCloseResult(

        EmpAttendance primaryAttendance,

        List<EmpAttendance> extraAttendances

) {
    public AttendanceCloseResult {
        state(primaryAttendance != null, "대표근태는 null일 수 없음");
        state(extraAttendances != null, "추가 근태는 null일 수 없음");

        if(!extraAttendances.isEmpty()) {
            extraAttendances.forEach(s -> requireNonNull(s, "각 일정은 null이 될 수 없음"));
        }
    }
}
