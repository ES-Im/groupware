package com.haruon.groupware.application.dept.deptService.dto.response.projection;

import com.haruon.groupware.domain.empInfo.enums.PositionCode;

public record DeptMemberInfo(
        Long empId,
        String empNo,
        String empName,
        String extensionNo,
        String email,
        PositionCode position
) {
}
