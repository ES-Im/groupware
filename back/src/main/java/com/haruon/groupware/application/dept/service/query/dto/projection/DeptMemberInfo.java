package com.haruon.groupware.application.dept.service.query.dto.projection;

import com.haruon.groupware.domain.employee.enums.PositionCode;

public record DeptMemberInfo(
        Long empId,
        String empNo,
        String empName,
        String extensionNo,
        String email,
        PositionCode position
) {
}
