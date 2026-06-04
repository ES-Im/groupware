package com.haruon.groupware.application.empInfo.emp.service.dto.response;

import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record BelongingInfo(
        Long deptId,
        String deptCode,
        String deptName,
        PositionCode positionName,
        Boolean isPrimary,
        @Nullable LocalDate startAt,
        @Nullable LocalDate endAt
) {}