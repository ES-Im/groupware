package com.haruon.groupware.application.empInfo.attendanceService.dto;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Builder
public record EditAttendanceByDeptManagerParam(

        Long targetEmpId,

        Long attendanceId,

        @Nullable LocalTime startAt,

        @Nullable LocalTime endAt,

        LocalDateTime editedAt,
        String editReason,
        Long editorId,

        boolean isIncludeHalfLeaveInDay

) {

    public EditAttendanceByDeptManagerParam {
        if(targetEmpId == null || attendanceId == null || editorId == null || editedAt == null || editReason == null) {
            throw new RequiredValueMissingException();
        }

        if(startAt == null && endAt == null) throw new RequiredValueMissingException();

        if (startAt != null && endAt != null) {
            if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
        }
    }
}