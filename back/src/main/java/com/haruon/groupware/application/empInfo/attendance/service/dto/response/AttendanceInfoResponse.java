package com.haruon.groupware.application.empInfo.attendance.service.dto.response;

import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceInfoResponse(

        AttendanceStatus attendanceStatus,

        LocalDate attendanceDate,

        LocalTime startAt,

        LocalTime endAt,

        Boolean isApproved,

        @Nullable Long draftId

) {
}
