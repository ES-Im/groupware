package com.haruon.groupware.adapter.webapi.employee.account.dto;

import com.haruon.groupware.domain.employee.enums.PositionCode;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record EmpBelongingsUpdateRequest(

        @Nullable
        Long deptId,

        @Nullable
        PositionCode position,

        @Nullable
        Boolean isPrimary,

        @Nullable
        LocalDate startAt,

        @Nullable
        LocalDate endAt

) {
}
