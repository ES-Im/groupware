package com.haruon.groupware.application.utils.required;

import com.haruon.groupware.application.utils.projection.DeptManagerAndTargetEmpInfo;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

public interface AuthorizationQueryRepository {

    // 해당 deptId의 매니저인지?
    boolean existsAdminOrCurrentDeptManagerByEmpIdAndDeptId(Long empId, Long deptId);

    // 타깃과 같은 dept면서 매니저인지?
    DeptManagerAndTargetEmpInfo findDeptManagerInfoIfSameCurrentDeptOrAdmin(Long managerId, Long targetEmpId);

    // systemRole코드에 특정 롤이 있나
    boolean existsActiveEmpByIdAndSystemRoleCodeOrAdmin(Long empId, SystemRoleCode code);

}
