package com.haruon.groupware.application.empInfo.empService.dto.response;

import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record BelongingInfo(
        Long id,
        String dept,
        PositionCode position,
        Boolean primary,
        @Nullable LocalDate startAt,
        @Nullable LocalDate endAt
) {}