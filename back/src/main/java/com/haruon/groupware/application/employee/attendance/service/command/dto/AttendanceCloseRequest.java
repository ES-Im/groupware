package com.haruon.groupware.application.employee.attendance.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;

import java.time.LocalDate;

public record AttendanceCloseRequest(

        Long empId,

        LocalDate attendanceDate

) {
    public AttendanceCloseRequest {
        if(attendanceDate == null || empId == null) {
            throw new RequiredValueMissingException();
        }
    }
}