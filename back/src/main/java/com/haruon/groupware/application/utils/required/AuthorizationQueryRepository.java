package com.haruon.groupware.application.utils.required;

import com.haruon.groupware.application.utils.projection.DeptManagerAndTargetEmpInfo;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;

public interface AuthorizationQueryRepository {

    boolean existsAdminOrCurrentDeptManagerByEmpIdAndDeptId(Long empId, Long deptId);

    DeptManagerAndTargetEmpInfo findDeptManagerInfoIfSameCurrentDeptOrAdmin(Long managerId, Long targetEmpId);

    boolean existsActiveEmpByIdAndSystemRoleCodeOrAdmin(Long empId, SystemRoleCode code);

}
