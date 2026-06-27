package com.haruon.groupware.application.dept.service.query.dto.projection;

import com.haruon.groupware.domain.employee.enums.PositionCode;

public record DeptInfoFlat(
        // dept
        Long deptId,
        String deptCode,
        String deptName,
        Boolean isActive,
        Long parentDeptId,

        // dept member - emp
        Long empId,
        String empNo,
        String empName,
        String extensionNo,
        String email,
        PositionCode positionCode
) {

}
