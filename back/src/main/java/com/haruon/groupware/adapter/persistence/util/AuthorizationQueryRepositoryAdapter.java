package com.haruon.groupware.adapter.persistence.util;

import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Objects;

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
    public boolean existsCurrentBelongingByManagerEmpIdAndDeptId(Long empId, Long deptId) {
        Long managerDeptId = query.select(dept.id)
                .from(belongings.dept)
                .where(belongings.emp.id.eq(empId))
                .fetchOne();

        return Objects.equals(managerDeptId, deptId);
    }

    @Override
    public boolean existsSameCurrentDeptByManagerIdAndTargetId(Long managerId, Long targetEmpId) {
        return false;
    }

    @Override
    public boolean existsByEmpIdAndSystemRoleCode(Long empId, SystemRoleCode code) {
        return false;
    }

    private Expression<Boolean> isSameDept(QDept dept1, QDept dept2) {
        return new CaseBuilder()
                .when(dept1.eq(dept2))
                .then(true)
                .otherwise(false);
    }
}
