package com.haruon.groupware.domain.empInfo.emp.dto;

import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.emp.PositionCode;
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
        if(startAt != null && endAt != null && endAt.isAfter(startAt)) {
            throw new IllegalArgumentException("종료일은 시작일보다 이후여야 합니다.");
        }
    }
}
