package com.haruon.groupware.application.employee.account.service.query.dto;

import com.haruon.groupware.domain.employee.enums.PositionCode;
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