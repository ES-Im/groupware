package com.haruon.groupware.application.empInfo.empService.dto.response;

import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record EmpInfoForManagementFlat(
        Long empId,
        String empNo,
        String empName,
        String loginId,
        String email,
        String extensionNo,
        EmpStatus status,
        LocalDate hireAt,
        LocalDate resignAt,

        Long deptId,
        String deptCode,
        String deptName,
        PositionCode positionName,
        Boolean isPrimary,
        @Nullable LocalDate startAt,
        @Nullable LocalDate endAt
) {
}
