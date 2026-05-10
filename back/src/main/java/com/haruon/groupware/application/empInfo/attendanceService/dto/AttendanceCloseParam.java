package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;

import java.time.LocalDate;

public record AttendanceCloseParam(

        Long empId,

        LocalDate attendanceDate

) {
    public AttendanceCloseParam {
        if(attendanceDate == null || empId == null) {
            throw new RequiredValueMissingException();
        }
    }
}