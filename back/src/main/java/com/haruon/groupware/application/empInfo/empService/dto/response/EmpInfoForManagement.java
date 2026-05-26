package com.haruon.groupware.application.empInfo.empService.dto.response;

import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

import java.time.LocalDate;
import java.util.List;

public record EmpInfoForManagement(
        // 기본정보
        Long empId,
        String empNo,
        String empName,
        String loginId,
        String email,
        String extensionNo,
        EmpStatus status,
        LocalDate hireAt,
        LocalDate resignAt,

        // 현재 소속 정보
        List<BelongingInfo> belongings,

        // 권한 정보
        List<SystemRoleCode> systemRoleCodeName
) {
}
