package com.haruon.groupware.adapter.persistence.emp;

import com.haruon.groupware.application.employee.leave.required.LeaveQueryRepository;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveUsageSummaryResponse;
import com.haruon.groupware.domain.employee.QDept;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.employee.QEmpLeave;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import com.haruon.groupware.domain.employee.enums.PositionCode;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class LeaveQueryRepositoryAdapter implements LeaveQueryRepository {

    private final JPAQueryFactory query;
    private final QEmpLeave empLeave;
    private final QEmp emp;
    private final QEmpBelongings empBelongings;
    private final QDept dept;

    public LeaveQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.empLeave = QEmpLeave.empLeave;
        this.emp = QEmp.emp;
        this.empBelongings = QEmpBelongings.empBelongings;
        this.dept = QDept.dept;
    }

    @Override
    public LeaveSummaryResponse findEmpLeaveSummaryByEmpIdAndYear(
            Long empId,
            Integer year
    ) {
        return query.select(leaveSummaryProjections())
                .from(empLeave)
                .where(
                        empLeave.grantYear.eq(year),
                        empLeave.emp.id.eq(empId)
                )
                .fetchOne();
    }

    @Override
    public Page<LeaveSummaryAndEmpInfoResponse> findLeaveSummary(
            @Nullable String keyword,
            @Nullable Long deptId,
            Integer year,
            Pageable pageable
    ) {
        Long size = query.select(empLeave.id.countDistinct())
                .from(empLeave)
                .join(empLeave.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(empBelongings.dept, dept)
                .where(
                        empBelongings.endAt.isNull(),
                        empLeave.grantYear.eq(year),
                        isDeptEq(deptId),
                        isPrimaryIfParamHasNotDeptId(deptId),
                        isEmpNameContains(keyword)
                )
                .fetchOne();

        long totalRows = size == null ? 0 : size;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<LeaveSummaryListFlat> flats = query
                .select(leaveSummaryListFlatProjections())
                .from(empLeave)
                .join(empLeave.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(empBelongings.dept, dept)
                .where(
                        empBelongings.endAt.isNull(),
                        empLeave.grantYear.eq(year),
                        isDeptEq(deptId),
                        isPrimaryIfParamHasNotDeptId(deptId),
                        isEmpNameContains(keyword)
                )
                .orderBy(dept.id.asc(), emp.empNo.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(toSummaryAndEmpInfoResponses(flats), pageable, totalRows);
    }


    private BooleanExpression isCurrentDeptEq(@Nullable Long deptId) {
        return deptId == null
                ? null
                : empBelongings.endAt.isNull()
                  .and(dept.id.eq(deptId));
    }

    private BooleanExpression isPrimaryIfParamHasNotDeptId(@Nullable Long deptId) {
        return deptId == null
                ? empBelongings.isPrimary.isTrue()
                : null;
    }

    public record LeaveSummaryListFlat(
            String empNo,
            String empName,
            String deptName,
            PositionCode positionName,
            Double annualBaseGrantDays,
            Double annualUsedDays,
            Double specialGrantDays,
            Double specialUsedDays,
            Double compensatoryGrantDays,
            Double compensatoryUsedDays
    ) {
        private LeaveSummaryResponse toLeaveSummaryResponse() {
            return new LeaveSummaryResponse(
                    annualBaseGrantDays,
                    annualUsedDays,
                    specialGrantDays,
                    specialUsedDays,
                    compensatoryGrantDays,
                    compensatoryUsedDays
            );
        }

        private LeaveSummaryAndEmpInfoResponse toSummaryAndEmpInfoResponse() {
            return new LeaveSummaryAndEmpInfoResponse(
                    empNo, empName, deptName, positionName.getDescription(),
                    toLeaveSummaryResponse()
            );
        }
    }

    private List<LeaveSummaryAndEmpInfoResponse> toSummaryAndEmpInfoResponses(
            List<LeaveSummaryListFlat> flats
    ) {
        List<LeaveSummaryAndEmpInfoResponse> list = new ArrayList<>();
        for (LeaveSummaryListFlat flat : flats) {
            list.add(flat.toSummaryAndEmpInfoResponse());
        }

        return list;
    }

    private ConstructorExpression<LeaveSummaryListFlat> leaveSummaryListFlatProjections() {
        return Projections.constructor(
                LeaveSummaryListFlat.class,
                emp.empNo,
                emp.empName,
                dept.deptName,
                empBelongings.position,

                empLeave.annualBaseGrantDays,
                empLeave.annualUsedDays,
                empLeave.specialGrantDays,
                empLeave.specialUsedDays,
                empLeave.compensatoryGrantDays,
                empLeave.compensatoryUsedDays
        );
    }

    private ConstructorExpression<LeaveSummaryResponse> leaveSummaryProjections() {
        return Projections.constructor(
                LeaveSummaryResponse.class,
                empLeave.annualBaseGrantDays,
                empLeave.annualUsedDays,
                empLeave.specialGrantDays,
                empLeave.specialUsedDays,
                empLeave.compensatoryGrantDays,
                empLeave.compensatoryUsedDays
        );
    }

    private BooleanExpression isDeptEq(@Nullable Long deptId) {
        return deptId == null
                ? null
                : dept.id.eq(deptId);
    }

    private BooleanExpression isEmpNameContains(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : emp.empName.containsIgnoreCase(keyword);
    }


    @Override
    public LeaveUsageSummaryResponse findLeaveUsageSummary(
            @Nullable Long deptId,
            Integer year
    ) {
        NumberExpression<Double> usedDaysSum = empLeave.annualUsedDays.sumDouble();
        NumberExpression<Double> grantDaysSum = empLeave.annualBaseGrantDays.sumDouble();

        JPAQuery<Tuple> usageQuery = query
                .select(usedDaysSum, grantDaysSum)
                .from(empLeave)
                .join(empLeave.emp, emp);

        if (deptId != null) {
            usageQuery
                    .join(emp.empBelongings, empBelongings)
                    .join(empBelongings.dept, dept);
        }

        Tuple tuple = usageQuery
                .where(
                        emp.status.eq(EmpStatus.ACTIVE),
                        empLeave.grantYear.eq(year),
                        isCurrentDeptEq(deptId)
                )
                .fetchOne();

        Double usedDays = tuple == null ? 0.0 : tuple.get(usedDaysSum);
        Double grantDays = tuple == null ? 0.0 : tuple.get(grantDaysSum);
        double used = usedDays == null ? 0.0 : usedDays;
        double grant = grantDays == null ? 0.0 : grantDays;

        double annualLeaveUsagePercent = (grant == 0.0)
                        ? 0.0
                        : used / grant * 100.0;

        return new LeaveUsageSummaryResponse(annualLeaveUsagePercent);
    }

}
