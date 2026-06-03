package com.haruon.groupware.application.dept.deptService.dto.response.projection;

public record DeptBasicInfo(
        Long deptId,
        String deptCode,
        String deptName,
        Boolean isActive,
        Long parentDeptId
) {}
