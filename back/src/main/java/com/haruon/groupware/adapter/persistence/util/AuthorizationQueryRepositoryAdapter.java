package com.haruon.groupware.adapter.persistence.util;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.DepartmentMismatchException;
import com.haruon.groupware.application.utils.projection.DeptManagerAndTargetEmpInfo;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class AuthorizationQueryRepositoryAdapter implements AuthorizationQueryRepository  {

    private final JPAQueryFactory query;
    private final QDept dept;
    private final QEmp emp;
    private final QEmpBelongings belongings;

    public AuthorizationQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.dept = QDept.dept;
        this.emp = QEmp.emp;
        this.belongings = QEmpBelongings.empBelongings;
    }

    @Override
    public boolean existsAdminOrCurrentDeptManagerByEmpIdAndDeptId(Long empId, Long deptId) {
        if(empId == null || deptId == null) throw new RequiredValueMissingException();
        if (hasAdminRoleByEmpId(empId)) return true;

        Integer exists = query.selectOne()
                .from(belongings)
                .join(belongings.emp, emp).on(emp.systemRoles.contains(SystemRoleCode.DEPT_MANAGER))
                .join(belongings.dept, dept).on(dept.isActive.isTrue())
                .where(
                        emp.id.eq(empId),
                        dept.id.eq(deptId),
                        belongings.endAt.isNull(),
                        isActiveEmp()
                ).fetchFirst();

        return exists != null;
    }

    @Override
    public DeptManagerAndTargetEmpInfo findDeptManagerInfoIfSameCurrentDeptOrAdmin(
            Long managerId,
            Long targetEmpId
    ) {
        if(managerId == null || targetEmpId == null) throw new RequiredValueMissingException();

        QEmp manager = new QEmp("manager");
        QEmp targetEmp = new QEmp("targetEmp");
        QEmpBelongings managerBelonging = new QEmpBelongings("managerBelonging");
        QEmpBelongings targetBelonging = new QEmpBelongings("targetBelonging");

        DeptManagerAndTargetEmpInfo info = query
                .select(Projections.constructor(
                        DeptManagerAndTargetEmpInfo.class,
                        manager,
                        targetEmp
                ))
                .from(manager, targetEmp)
                .where(
                        manager.id.eq(managerId),
                        targetEmp.id.eq(targetEmpId)
                )
                .fetchFirst();

        if (info == null || info.managerEmp() == null || info.editedTargetEmp() == null) {
            return null;
        }

        if (!info.managerEmp().getStatus().equals(EmpStatus.ACTIVE)) {
            throw new ActiveEmployeeNotFoundException();
        }

        if (info.managerEmp().isAdmin()) {
            return info;
        }

        if (!info.managerEmp().getSystemRoles().contains(SystemRoleCode.DEPT_MANAGER)) {
            return null;
        }

        Integer sameCurrentDept = query
                .selectOne()
                .from(managerBelonging, targetBelonging)
                .where(
                        managerBelonging.emp.id.eq(managerId),
                        targetBelonging.emp.id.eq(targetEmpId),
                        managerBelonging.endAt.isNull(),
                        targetBelonging.endAt.isNull(),
                        managerBelonging.dept.eq(targetBelonging.dept)
                )
                .fetchFirst();

        if (sameCurrentDept == null) {
            throw new DepartmentMismatchException();
        }

        return info;
    }

    @Override
    public boolean existsActiveEmpByIdAndSystemRoleCodeOrAdmin(Long empId, SystemRoleCode code) {
        if(empId == null || code == null) throw new RequiredValueMissingException();

        Integer exists = query.selectOne()
                .from(emp)
                .where(
                        emp.id.eq(empId),
                        isActiveEmp(),
                        hasSystemRoleOrAdminRole(code)
                )
                .fetchFirst();

        return exists != null;
    }

    private BooleanExpression isActiveEmp() {
        return emp.status.eq(EmpStatus.ACTIVE);
    }

    private BooleanExpression hasSystemRoleOrAdminRole(SystemRoleCode role) {
        if (role == SystemRoleCode.ADMIN) {
            return emp.systemRoles.contains(SystemRoleCode.ADMIN);
        }

        return emp.systemRoles.contains(SystemRoleCode.ADMIN)
                .or(emp.systemRoles.contains(role));
    }

    private boolean hasAdminRoleByEmpId(Long empId) {
        Integer hasAdminRole = query.selectOne()
                .from(emp)
                .where(
                        emp.id.eq(empId),
                        isActiveEmp(),
                        emp.systemRoles.contains(SystemRoleCode.ADMIN))
                .fetchFirst();

        return hasAdminRole != null;
    }

}
