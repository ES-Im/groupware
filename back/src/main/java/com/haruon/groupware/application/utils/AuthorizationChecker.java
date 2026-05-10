package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.DepartmentMismatchException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

import java.util.Set;
import java.util.stream.Collectors;

//todo :  커스텀 예외처리 필요
public class AuthorizationChecker {
    /**
     * ACTIVE 사원 검증
     */
    public static Emp findActiveEmpById(EmpRepository empRepository, Long id) {
        if(id == null) throw new RequiredValueMissingException();

        return empRepository
                .findById(id)
                .filter(e -> e.getStatus().equals(EmpStatus.ACTIVE))
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    /**
     * ADMIN 롤 권한 검증
     */
    public static void checkAdminById(EmpRepository empRepository, Long id) {
        Emp foundEmp = findActiveEmpById(empRepository, id);

        notExistRoleThrowException(foundEmp, SystemRoleCode.ADMIN);
    }

    /**
     * DEPT_MANAGER 롤 권한 검증
     */
    public static DeptManagerInfo checkDeptManagerById(
            EmpRepository empRepository, Long managerId, Long editTargetId
    ) {
        Emp manager = findActiveEmpById(empRepository, managerId);
        Emp editTarget = findActiveEmpById(empRepository, editTargetId);

        if (manager.getSystemRoles().contains(SystemRoleCode.ADMIN)) {
            return new DeptManagerInfo(manager, editTarget);
        }

        notExistRoleThrowException(manager, SystemRoleCode.DEPT_MANAGER);

        Set<Dept> managerDept = getCurrentDept(manager);
        Set<Dept> targetEmpDept = getCurrentDept(editTarget);

        validateSameDept(managerDept, targetEmpDept);

        return new DeptManagerInfo(manager, editTarget);
    }
    public record DeptManagerInfo(Emp manager, Emp targetEmp) {}

    /**
     * FRANCHISE 롤 검증
     */
    public static void checkFranchiseRoleEmp(EmpRepository empRepository, long empId) {
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.FRANCHISE);
    }

    /**
     *  IT 롤 검증
     */
    public static void checkITRoleEmp(EmpRepository empRepository, long empId) {
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.IT);
    }

    /**
     *  HR 롤 검증
     */
    public static void checkHRRoleEmp(EmpRepository empRepository, long empId) {
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.HR);
    }

    /**
     *  FACILITY 롤 검증
     */
    public static void checkFacilityRoleEmp(EmpRepository empRepository, long empId) {
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.FACILITY);
    }

    private static Set<Dept> getCurrentDept(Emp emp) {
        return emp.getEmpBelongings().stream()
                .filter(b -> b.getEndAt() == null)
                .map(EmpBelongings::getDept)
                .collect(Collectors.toSet());
    }

    private static void validateSameDept(Set<Dept> managerDept, Set<Dept> targetEmpDept) {
        boolean isSameDept = managerDept.stream()
                .anyMatch(targetEmpDept::contains);

        if(!isSameDept) throw new DepartmentMismatchException();
    }

    private static void notExistRoleThrowException(Emp emp, SystemRoleCode role) {
        boolean hasAdminRole = emp.getSystemRoles().contains(SystemRoleCode.ADMIN);
        boolean hasRequiredRole = emp.getSystemRoles().contains(role);

        if(!hasRequiredRole && !hasAdminRole) {
            throw new PermissionDeniedException();
        }
    }

}
