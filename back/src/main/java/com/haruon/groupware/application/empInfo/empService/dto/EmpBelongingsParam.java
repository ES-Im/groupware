package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

@Builder
public record EmpBelongingsParam(

        @Nullable
        Dept dept,

        @Nullable
        PositionCode position,

        @Nullable
        Boolean isPrimary,

        @Nullable
        LocalDate startAt,

        @Nullable
        LocalDate endAt

) {
    public EmpBelongingsParam {
        if(dept == null && position == null && isPrimary == null && startAt == null && endAt == null) {
            throw new RequiredValueMissingException();
        }

        if(startAt != null && endAt != null && endAt.isBefore(startAt)) {
            throw new EndTimeBeforeStartTimeException();
        }
    }
}
