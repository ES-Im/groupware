package com.haruon.groupware.application.empInfo.attendance.service.dto.request;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ApproveAttendanceByDeptManagerRequest(
        @NotNull Long targetEmpId,

        @NotNull LocalDateTime approvedAt
) {

    public ApproveAttendanceByDeptManagerRequest {
        if(targetEmpId == null || approvedAt == null) {
            throw new RequiredValueMissingException();
        }
    }

}
