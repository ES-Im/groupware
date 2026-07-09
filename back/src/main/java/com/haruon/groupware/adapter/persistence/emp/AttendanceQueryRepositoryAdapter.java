package com.haruon.groupware.adapter.persistence.emp;

import com.haruon.groupware.application.employee.attendance.required.AttendanceQueryRepository;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.DeptAttendanceEmpInfo;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptAttendanceResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.employee.Attendance;
import com.haruon.groupware.domain.employee.QAttendance;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public class AttendanceQueryRepositoryAdapter implements AttendanceQueryRepository {

    private final JPAQueryFactory query;
    private final CompanyPolicyPort companyPolicy;
    private final QAttendance qAttendance;
    private final QEmp qEmp;
    private final QEmpBelongings qEmpBelongings;

    public AttendanceQueryRepositoryAdapter(JPAQueryFactory query, CompanyPolicyPort companyPolicy) {
        this.query = query;
        this.companyPolicy = companyPolicy;
        this.qAttendance = QAttendance.attendance;
        this.qEmp = QEmp.emp;
        this.qEmpBelongings = QEmpBelongings.empBelongings;
    }

    @Override
    public Page<AttendanceInfoResponse> findMonthlyAttendancesByEmpIdAndYearMonth(
            Long empId,
            YearMonth targetYearMonth,
            @Nullable AttendanceStatus status,
            Pageable pageable
    ) {
        Long total = query
                .select(qAttendance.id.count())
                .from(qAttendance)
                .where(
                        qAttendance.emp.id.eq(empId),
                        attendanceDateBetween(targetYearMonth),
                        attendanceStatusEq(status)
                )
                .fetchOne();

        long totalRows = total == null ? 0 : total;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<AttendanceInfoResponse> responses = query
                .select(attendanceInfoExpression())
                .from(qAttendance)
                .where(
                        qAttendance.emp.id.eq(empId),
                        attendanceDateBetween(targetYearMonth),
                        attendanceStatusEq(status)
                )
                .orderBy(qAttendance.attendanceDate.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public AttendanceInfoSummaryResponse findMonthlySummaryByEmpIdAndYearMonth(Long empId, YearMonth targetYearMonth) {
        List<Attendance> attendances = query
                .selectFrom(qAttendance)
                .where(
                        qAttendance.emp.id.eq(empId),
                        attendanceDateBetween(targetYearMonth)
                )
                .fetch();

        int approvedCount = (int) attendances.stream()
                .filter(attendance -> attendance.getApprovedAt() != null)
                .count();
        int totalCount = attendances.size();

        int overtimeMinutes = attendances.stream()
                .mapToInt(attendance -> calculateOvertimeMinutes(attendance.getStartAt(), attendance.getEndAt()))
                .sum();

        return new AttendanceInfoSummaryResponse(
                approvedCount,
                totalCount - approvedCount,
                totalCount,
                overtimeMinutes
        );
    }

    @Override
    public Page<DeptPendingAttendanceResponse> findMonthlyNotApprovedAttendancesByDeptId(Long deptId, Pageable pageable) {
        Long total = query
                .select(qAttendance.id.countDistinct())
                .from(qAttendance)
                .join(qAttendance.emp, qEmp)
                .join(qEmp.empBelongings, qEmpBelongings)
                .where(
                        qEmpBelongings.dept.id.eq(deptId),
                        qEmpBelongings.endAt.isNull(),
                        qAttendance.attendanceStatus.isNotNull(),
                        qAttendance.approvedAt.isNull()
                )
                .fetchOne();

        long totalRows = total == null ? 0 : total;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DeptPendingAttendanceResponse> responses = query
                .select(Projections.constructor(
                        DeptPendingAttendanceResponse.class,
                        deptAttendanceEmpInfoExpression(),
                        attendanceInfoExpression()
                ))
                .from(qAttendance)
                .join(qAttendance.emp, qEmp)
                .join(qEmp.empBelongings, qEmpBelongings)
                .where(
                        qEmpBelongings.dept.id.eq(deptId),
                        qEmpBelongings.endAt.isNull(),
                        qAttendance.attendanceStatus.isNotNull(),
                        qAttendance.approvedAt.isNull()
                )
                .orderBy(qAttendance.attendanceDate.asc(), qEmp.empNo.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public Page<DeptAttendanceResponse> findMonthlyAttendancesByDeptId(
            Long deptId,
            YearMonth targetYearMonth,
            @Nullable String empNameKeyword,
            @Nullable AttendanceStatus attendanceStatus,
            Pageable pageable
    ) {
        Long total = query
                .select(qEmp.id.countDistinct())
                .from(qAttendance)
                .join(qAttendance.emp, qEmp)
                .join(qEmp.empBelongings, qEmpBelongings)
                .where(
                        qEmpBelongings.dept.id.eq(deptId),
                        qEmpBelongings.endAt.isNull(),
                        attendanceDateBetween(targetYearMonth),
                        empNameKeywordContains(empNameKeyword),
                        attendanceStatusEq(attendanceStatus)
                )
                .fetchOne();

        long totalRows = total == null ? 0 : total;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<Long> empIds = query
                .select(qEmp.id)
                .from(qAttendance)
                .join(qAttendance.emp, qEmp)
                .join(qEmp.empBelongings, qEmpBelongings)
                .where(
                        qEmpBelongings.dept.id.eq(deptId),
                        qEmpBelongings.endAt.isNull(),
                        attendanceDateBetween(targetYearMonth),
                        empNameKeywordContains(empNameKeyword),
                        attendanceStatusEq(attendanceStatus)
                )
                .groupBy(qEmp.id)
                .orderBy(qEmp.empNo.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        if(empIds.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);

        List<DeptAttendanceFlat> flats = query
                .select(Projections.constructor(
                        DeptAttendanceFlat.class,
                        qEmp.id,
                        qEmp.empNo,
                        qEmp.empName,
                        qEmpBelongings.dept.deptName,
                        qEmpBelongings.position.stringValue(),
                        qAttendance.id,
                        qAttendance.attendanceStatus,
                        qAttendance.attendanceDate,
                        qAttendance.startAt,
                        qAttendance.endAt,
                        isApprovedExpression()
                ))
                .from(qAttendance)
                .join(qAttendance.emp, qEmp)
                .join(qEmp.empBelongings, qEmpBelongings)
                .where(
                        qEmp.id.in(empIds),
                        qEmpBelongings.dept.id.eq(deptId),
                        qEmpBelongings.endAt.isNull(),
                        attendanceDateBetween(targetYearMonth),
                        attendanceStatusEq(attendanceStatus)
                )
                .orderBy(qEmp.empNo.asc(), qAttendance.attendanceDate.asc())
                .fetch();

        return new PageImpl<>(toDeptAttendanceResponses(flats), pageable, totalRows);
    }

    private Expression<AttendanceInfoResponse> attendanceInfoExpression() {
        return Projections.constructor(
                AttendanceInfoResponse.class,
                qAttendance.id,
                qAttendance.attendanceStatus,
                qAttendance.attendanceDate,
                qAttendance.startAt,
                qAttendance.endAt,
                isApprovedExpression(),
                com.querydsl.core.types.dsl.Expressions.nullExpression(Long.class)
        );
    }

    private Expression<DeptAttendanceEmpInfo> deptAttendanceEmpInfoExpression() {
        return Projections.constructor(
                DeptAttendanceEmpInfo.class,
                qEmp.id,
                qEmp.empNo,
                qEmp.empName,
                qEmpBelongings.dept.deptName,
                qEmpBelongings.position.stringValue()
        );
    }

    private Expression<Boolean> isApprovedExpression() {
        return new CaseBuilder()
                .when(qAttendance.approvedAt.isNotNull())
                .then(true)
                .otherwise(false);
    }

    private List<DeptAttendanceResponse> toDeptAttendanceResponses(List<DeptAttendanceFlat> flats) {
        Map<Long, List<DeptAttendanceFlat>> rowsByEmpId = flats.stream()
                .collect(Collectors.groupingBy(
                        DeptAttendanceFlat::empId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return rowsByEmpId.values().stream()
                .map(rows -> {
                    DeptAttendanceFlat first = rows.getFirst();
                    List<AttendanceInfoResponse> attendanceInfos = rows.stream()
                            .map(DeptAttendanceFlat::toAttendanceInfoResponse)
                            .toList();

                    return new DeptAttendanceResponse(
                            new DeptAttendanceEmpInfo(
                                    first.empId(),
                                    first.empNo(),
                                    first.empName(),
                                    first.deptName(),
                                    first.positionName()
                            ),
                            toSummary(attendanceInfos),
                            attendanceInfos
                    );
                })
                .toList();
    }

    private AttendanceInfoSummaryResponse toSummary(List<AttendanceInfoResponse> attendanceInfos) {
        int approvedCount = (int) attendanceInfos.stream()
                .filter(AttendanceInfoResponse::isApproved)
                .count();
        int totalCount = attendanceInfos.size();
        int overtimeMinutes = attendanceInfos.stream()
                .mapToInt(attendanceInfo -> calculateOvertimeMinutes(attendanceInfo.startAt(), attendanceInfo.endAt()))
                .sum();

        return new AttendanceInfoSummaryResponse(
                approvedCount,
                totalCount - approvedCount,
                totalCount,
                overtimeMinutes
        );
    }

    private int calculateOvertimeMinutes(@Nullable LocalTime startAt, @Nullable LocalTime endAt) {
        if(startAt == null || endAt == null) return 0;

        int workMinutes = (companyPolicy.getWorkHours() - companyPolicy.getBreakHours()) * 60;
        int attendanceMinutes = (int) Duration.between(startAt, endAt).toMinutes();

        return Math.max(attendanceMinutes - workMinutes, 0);
    }

    private BooleanExpression attendanceDateBetween(YearMonth yearMonth) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        return qAttendance.attendanceDate.between(startDate, endDate);
    }

    private BooleanExpression attendanceStatusEq(@Nullable AttendanceStatus status) {
        return status == null ? null : qAttendance.attendanceStatus.eq(status);
    }

    private BooleanExpression empNameKeywordContains(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : qEmp.empName.containsIgnoreCase(keyword);
    }

    public record DeptAttendanceFlat(
            Long empId,
            String empNo,
            String empName,
            String deptName,
            String positionName,
            Long attendanceId,
            AttendanceStatus attendanceStatus,
            LocalDate attendanceDate,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            Boolean isApproved
    ) {

        private AttendanceInfoResponse toAttendanceInfoResponse() {
            return new AttendanceInfoResponse(
                    attendanceId,
                    attendanceStatus,
                    attendanceDate,
                    startAt,
                    endAt,
                    isApproved,
                    null
            );
        }
    }
}
