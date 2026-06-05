package com.haruon.groupware.application.utils.projection;

import com.haruon.groupware.domain.empInfo.Emp;

/**
 * findDeptManagerInfoIfSameCurrentDeptOrAdmin
 * 쿼리 권한 검증 후 반환용 DTO application 내부에서만 사용
 */
public record DeptManagerAndTargetEmpInfo(
        Emp managerEmp,
        Emp editedTargetEmp
) {
}
