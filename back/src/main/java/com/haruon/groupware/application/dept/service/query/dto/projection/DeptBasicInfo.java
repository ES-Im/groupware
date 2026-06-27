package com.haruon.groupware.application.dept.service.query.dto.projection;

public record DeptBasicInfo(
        Long deptId,
        String deptCode,
        String deptName,
        Boolean isActive,
        Long parentDeptId
) {}
