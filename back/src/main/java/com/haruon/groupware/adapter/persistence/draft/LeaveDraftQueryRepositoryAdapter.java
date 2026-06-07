package com.haruon.groupware.adapter.persistence.draft;

import com.haruon.groupware.application.draft.required.LeaveDraftQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.QApproval;
import com.haruon.groupware.domain.draft.QLeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class LeaveDraftQueryRepositoryAdapter implements LeaveDraftQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp emp;
    private final QEmpBelongings empBelongings;
    private final QApproval approval;
    private final QLeaveDraft leaveDraft;
    private final CompanyPolicyPort companyPolicyPort;

    public LeaveDraftQueryRepositoryAdapter(JPAQueryFactory query, CompanyPolicyPort companyPolicyPort) {
        this.query = query;
        this.emp = QEmp.emp;
        this.empBelongings = QEmpBelongings.empBelongings;
        this.approval = QApproval.approval;
        this.leaveDraft = QLeaveDraft.leaveDraft;
        this.companyPolicyPort = companyPolicyPort;
    }

    @Override
    public List<LeaveRequestHistoryResponse> findLeaveRequestHistoriesByEmpIdAndYearMonth(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    ) {
        List<LeaveRequestHistoryResponseAcceptor> acceptors = query
                .select(acceptorConstructorExpression()).from(leaveDraft)
                .join(leaveDraft.approval, approval)
                .where(
                        leaveDraft.emp.id.eq(empId),
                        isStatusEq(approvalStatus),
                        isOverlappedWithYearMonth(yearMonth)
                ).fetch();

        int actualWorkHour = companyPolicyPort.getWorkHours();

        return acceptors.stream()
                .map(acceptor -> acceptor.toLeaveRequestHistoryResponse(actualWorkHour))
                .toList();
    }

    @Override
    public Page<LeaveRequestHistoryAndEmpInfoResponse> findLeaveRequestHistoriesByDeptIdAndYearMonth (
            Long deptId,
            YearMonth yearMonth,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            Pageable pageable
    ) {
        Long rows = query
                .select(leaveDraft.id.countDistinct())
                .from(leaveDraft)
                .join(leaveDraft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(leaveDraft.approval, approval)
                .where(
                        empBelongings.dept.id.eq(deptId),
                        empBelongings.endAt.isNull(),
                        isOverlappedWithYearMonth(yearMonth),
                        isEmpNameContains(keyword),
                        isStatusEq(approvalStatus)
                ).fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<Tuple> tuple = query
                .select(
                        emp.id, emp.empNo, emp.empName,
                        acceptorConstructorExpression()).from(leaveDraft)
                .join(leaveDraft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(leaveDraft.approval, approval)
                .where(
                        empBelongings.dept.id.eq(deptId),
                        empBelongings.endAt.isNull(),
                        isOverlappedWithYearMonth(yearMonth),
                        isEmpNameContains(keyword),
                        isStatusEq(approvalStatus)
                )
                .orderBy(
                        emp.empNo.asc(),
                        leaveDraft.startAt.desc(),
                        leaveDraft.id.desc()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<LeaveRequestHistoryAndEmpInfoAssembler> assemblers = new ArrayList<>();

        for (Tuple row : tuple) {
            Long empId = row.get(emp.id);
            String empNo = row.get(emp.empNo);
            String empName = row.get(emp.empName);

            LeaveRequestHistoryResponseAcceptor history =
                    row.get(3, LeaveRequestHistoryResponseAcceptor.class);

            assemblers.add(
                    new LeaveRequestHistoryAndEmpInfoAssembler(empId, empNo, empName, history)
            );
        }

        int actualWorkHour = companyPolicyPort.getWorkHours();
        List<LeaveRequestHistoryAndEmpInfoResponse> responses = assemblers.stream()
                .map(assembler -> assembler.toLeaveRequestHistoryAndEmpInfoResponse(actualWorkHour))
                .toList();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    public record LeaveRequestHistoryAndEmpInfoAssembler(
            Long empId,
            String empNo,
            String empName,
            LeaveRequestHistoryResponseAcceptor acceptor
    ) {
        LeaveRequestHistoryAndEmpInfoResponse toLeaveRequestHistoryAndEmpInfoResponse(int actualWorkHour) {

            return new LeaveRequestHistoryAndEmpInfoResponse(
                    empId, empNo, empName, acceptor.toLeaveRequestHistoryResponse(actualWorkHour)
            );
        }
    }

    public record LeaveRequestHistoryResponseAcceptor(
            Long draftId,

            LeaveType leaveType,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Long reservedHours,

            ApprovalStatus approvalStatus
    ) {
        private String resolveApprovalStatusName(
                ApprovalStatus approvalStatus
        ) {
            return approvalStatus.getDescription();
        }

        private String resolveLeaveTypeName(
                LeaveType leaveType,
                Long reservedHours,
                int actualWorkHour
        ) {
            if (leaveType != LeaveType.ANNUAL) {
                return leaveType.getDescription();
            }

            if (reservedHours == actualWorkHour / 2L) {
                return "반차";
            }

            if (reservedHours * 2 == actualWorkHour) {
                return "반차";
            }

            return leaveType.getDescription();
        }

        LeaveRequestHistoryResponse toLeaveRequestHistoryResponse(int actualWorkHour) {
            double requestedLeaveDays = reservedHours / (double) actualWorkHour;

            return new LeaveRequestHistoryResponse(
                    draftId,
                    resolveLeaveTypeName(leaveType, reservedHours, actualWorkHour),
                    startAt.toLocalDate(),
                    endAt.toLocalDate(),
                    requestedLeaveDays,
                    resolveApprovalStatusName(approvalStatus)
            );
        }
    }

    private ConstructorExpression<LeaveRequestHistoryResponseAcceptor> acceptorConstructorExpression() {
        return Projections.constructor(
                LeaveRequestHistoryResponseAcceptor.class,
                leaveDraft.id,
                leaveDraft.leaveType,
                leaveDraft.startAt,
                leaveDraft.endAt,
                leaveDraft.reservedHours,
                approval.status
        );
    }

    private BooleanExpression isStatusEq(@Nullable ApprovalStatus approvalStatus) {
        return approvalStatus == null
                ? null
                : approval.status.eq(approvalStatus);
    }

    private BooleanExpression isEmpNameContains(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : emp.empName.containsIgnoreCase(keyword);
    }

    private BooleanExpression isOverlappedWithYearMonth(YearMonth yearMonth) {
        LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime nextMonthStart = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return leaveDraft.startAt.lt(nextMonthStart)
                .and(leaveDraft.endAt.goe(monthStart));
    }

}
