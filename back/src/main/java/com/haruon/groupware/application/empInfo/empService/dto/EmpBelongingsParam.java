package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static org.springframework.util.Assert.state;

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
        state(dept != null || position != null || isPrimary != null || startAt != null || endAt != null,
                "변경할 내용이 없음");

        if(startAt != null && endAt != null && endAt.isAfter(startAt)) {
            throw new IllegalArgumentException("종료일은 시작일보다 이후여야 합니다.");
        }
    }
}
