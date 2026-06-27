package com.haruon.groupware.application.dept.service.query.dto;

import com.haruon.groupware.application.dept.service.query.dto.projection.DeptBasicInfo;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptInfoFlat;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptMemberInfo;

public record DeptInfoResponse(
        DeptBasicInfo deptInfoResponse,
        DeptMemberInfo deptLeader
) {

    public static DeptInfoResponse of(DeptInfoFlat flat) {
        return new DeptInfoResponse(
                new DeptBasicInfo(flat.deptId(), flat.deptCode(), flat.deptName(), flat.isActive(), flat.parentDeptId()),
                new DeptMemberInfo(flat.empId(), flat.empNo(), flat.empName(), flat.extensionNo(), flat.email(), flat.positionCode())
        );
    }
}
