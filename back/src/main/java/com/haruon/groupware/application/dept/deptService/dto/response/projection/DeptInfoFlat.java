package com.haruon.groupware.application.dept.deptService.dto.response.projection;

import com.haruon.groupware.domain.empInfo.enums.PositionCode;

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
