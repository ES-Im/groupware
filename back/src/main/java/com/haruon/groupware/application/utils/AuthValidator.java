package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.projection.DeptManagerAndTargetEmpInfo;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

public class AuthValidator {

    /**
     * ACTIVE 사원 검증
     */
    public static Emp findActiveEmpById(
            EmpRepository repository, Long empId
    ) {
        if(empId == null) throw new RequiredValueMissingException();

        return repository
                .findById(empId)
                .filter(e -> e.getStatus().equals(EmpStatus.ACTIVE))
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    /**
     * ADMIN 검증
     */
    public static void checkAdminById(AuthorizationQueryRepository repository, Long id) {
        checkSystemRoleOrAdmin(repository, id, SystemRoleCode.ADMIN);
    }

    /**
     * DEPT_MANAGER 롤 권한 검증
     */
    public static void checkDeptManagerOrAdminByEmpIdAndDeptId(
            AuthorizationQueryRepository repository,
            Long empId,
            Long deptId
    ) {
        if(empId == null || deptId == null) throw new RequiredValueMissingException();

        permissionCheck(repository.existsAdminOrCurrentDeptManagerByEmpIdAndDeptId(empId, deptId));
    }


    // checkDeptManagerByIdAndEmpId 리팩터
    public static DeptManagerAndTargetEmpInfo checkSameDeptManagerByManagerIdAndEmpId (
            AuthorizationQueryRepository repository,
            Long managerId,
            Long editTargetId
    ) {
        if(managerId == null || editTargetId == null) throw new RequiredValueMissingException();

        DeptManagerAndTargetEmpInfo info = repository.findDeptManagerInfoIfSameCurrentDeptOrAdmin(
                managerId, editTargetId
        );

        if(info == null || info.editedTargetEmp() == null || info.managerEmp() == null) throw new PermissionDeniedException();

        return info;
    }

    /**
     * FRANCHISE 롤 검증
     */
    public static void checkFranchiseRoleEmp(AuthorizationQueryRepository repository, Long id) {
        checkSystemRoleOrAdmin(repository, id, SystemRoleCode.FRANCHISE);
    }

    /**
     *  IT 롤 검증
     */
    public static void checkITRoleEmp(AuthorizationQueryRepository repository, long id) {
        checkSystemRoleOrAdmin(repository, id, SystemRoleCode.IT);
    }

    /**
     *  HR 롤 검증
     */
    public static void checkHRRoleEmp(AuthorizationQueryRepository repository, long id) {
        checkSystemRoleOrAdmin(repository, id, SystemRoleCode.HR);
    }

    /**
     *  FACILITY 롤 검증
     */
    public static void checkFacilityRoleEmp(AuthorizationQueryRepository repository, long id) {
        checkSystemRoleOrAdmin(repository, id, SystemRoleCode.FACILITY);
    }


    private static void checkSystemRoleOrAdmin(
            AuthorizationQueryRepository repository,
            Long empId,
            SystemRoleCode role
    ) {
        boolean checkRoles = repository.existsActiveEmpByIdAndSystemRoleCodeOrAdmin(empId, role);
        permissionCheck(checkRoles);
    }

    private static void permissionCheck(boolean checkRoles) {
        if(!checkRoles) throw new PermissionDeniedException();
    }

}
