package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.DepartmentMismatchException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.empInfo.dept.DeptIsNotActiveException;
import com.haruon.groupware.application.exception.empInfo.dept.DeptNotFoundException;
import com.haruon.groupware.application.exception.empInfo.emp.InvalidPasswordException;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

import java.util.Set;
import java.util.stream.Collectors;

//todo FK 타는거 때문에 쿼리 비효율성 있을 듯, AuthorizationChecker 전용 QueryAdapter를 만들 필요 있어보임.
public class AuthorizationValidator {

    /** 비밀번호 확인 */
    public static void validateCurrentPassword(EmpPasswordEncoder encoder, String rawPassword, String encodedPassword) {
        if(!encoder.matches(rawPassword, encodedPassword)) {
            throw new InvalidPasswordException();
        };
    }

    /**
     * ACTIVE 사원 검증
     */
    public static Emp findActiveEmpById(EmpRepository empRepository, Long id) {                             // 유지
        if(id == null) throw new RequiredValueMissingException();

        return empRepository
                .findById(id)
                .filter(e -> e.getStatus().equals(EmpStatus.ACTIVE))
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    /**
     * ACTIVE 사원 검증(loginId)
     */
    public static Emp findActiveEmpByLoginId(EmpRepository empRepository, String loginId) {              // 유지
        if(loginId == null) throw new RequiredValueMissingException();

        return empRepository
                .findByLoginId(loginId)
                .filter(e -> e.getStatus().equals(EmpStatus.ACTIVE))
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    /**
     * ADMIN 롤 권한 검증
     */
    public static void checkAdminById(EmpRepository empRepository, Long id) {       // existsByEmpIdANDSystemRoleCode
        Emp foundEmp = findActiveEmpById(empRepository, id);

        notExistRoleThrowException(foundEmp, SystemRoleCode.ADMIN);
    }

    /**
     * DEPT_MANAGER 롤 권한 검증
     */
    public static void checkDeptManagerById(EmpRepository empRepository, Long id) {     // 삭제 필요할듯(쓸일없어야할 메서드)
        Emp foundEmp = findActiveEmpById(empRepository, id);

        notExistRoleThrowException(foundEmp, SystemRoleCode.DEPT_MANAGER);
    }

    public static void checkDeptManagerByIdAndDeptId(EmpRepository empRepository, DeptRepository deptRepository, Long managerId, Long deptId) { // existsCurrentBelongingByEmpIdAndDeptId
        Emp foundManager = findActiveEmpById(empRepository, managerId);
        if(foundManager.getSystemRoles().contains(SystemRoleCode.ADMIN)) return;
        notExistRoleThrowException(foundManager, SystemRoleCode.DEPT_MANAGER);

        Dept foundDept = deptRepository.findById(deptId).orElseThrow(DeptNotFoundException::new);
        if(!foundDept.isActive()) throw new DeptIsNotActiveException();

        Set<Dept> currentDept = getCurrentDept(foundManager);
        if(currentDept.contains(foundDept)) return;
        else throw new PermissionDeniedException();
    }


    public static DeptManagerInfo checkDeptManagerByIdAndEmpId(     // existsSameCurrentDept
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
    public static void checkFranchiseRoleEmp(EmpRepository empRepository, long empId) { // existsByEmpIdANDSystemRoleCode
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.FRANCHISE);
    }

    /**
     *  IT 롤 검증
     */
    public static void checkITRoleEmp(EmpRepository empRepository, long empId) {    // existsByEmpIdANDSystemRoleCode
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.IT);
    }

    /**
     *  HR 롤 검증
     */
    public static void checkHRRoleEmp(EmpRepository empRepository, long empId) {    // existsByEmpIdANDSystemRoleCode
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        notExistRoleThrowException(foundEmp, SystemRoleCode.HR);
    }

    /**
     * HR 또는 DEPT MANAGER 롤 검증
     */
    public static void checkHRorDeptManagerRoleEmp(EmpRepository empRepository, long empId) {   // 삭제 예정
        Emp foundEmp = findActiveEmpById(empRepository, empId);

        if(foundEmp.getSystemRoles().contains(SystemRoleCode.HR)) return;
        notExistRoleThrowException(foundEmp, SystemRoleCode.DEPT_MANAGER);
    }

    /**
     *  FACILITY 롤 검증
     */
    public static void checkFacilityRoleEmp(EmpRepository empRepository, long empId) {  // existsByEmpIdANDSystemRoleCode
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
