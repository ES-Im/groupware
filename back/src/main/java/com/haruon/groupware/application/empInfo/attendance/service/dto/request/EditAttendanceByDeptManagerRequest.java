package com.haruon.groupware.application.empInfo.attendance.service.dto.request;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Builder
public record EditAttendanceByDeptManagerRequest(

        @NotNull Long targetEmpId,

        @Nullable LocalTime startAt,

        @Nullable LocalTime endAt,

        @NotNull LocalDateTime editedAt,
        @NotBlank @Size(max = 100) String editReason
) {

    public EditAttendanceByDeptManagerRequest {
        if(targetEmpId == null || editedAt == null || editReason == null) {
            throw new RequiredValueMissingException();
        }

        if(startAt == null && endAt == null) throw new RequiredValueMissingException();

        if (startAt != null && endAt != null) {
            if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
        }
    }
}
