package com.haruon.groupware.adapter.persistence.draft;

import com.haruon.groupware.application.draft.required.LeaveDraftQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.domain.draft.QApproval;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.empInfo.QEmpLeave;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Slf4j
@Repository
public class LeaveDraftQueryRepositoryAdapter implements LeaveDraftQueryRepository {

    private final JPAQueryFactory query;
    private final QEmpLeave empLeave;
    private final QEmp emp;
    private final QEmpBelongings empBelongings;
    private final QApproval approval;
    private final QDept dept;

    public LeaveDraftQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.empLeave = QEmpLeave.empLeave;
        this.emp = QEmp.emp;
        this.empBelongings = QEmpBelongings.empBelongings;
        this.approval = QApproval.approval;
        this.dept = QDept.dept;
    }

    //todo - 쿼리 완성시키기. 연가 신청이력 조회하는 쿼리들임 (My & Management용)
    @Override
    public List<LeaveRequestHistoryResponse> findLeaveRequestHistoriesByEmpIdAndYearMonth(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    ) {
        return List.of();
    }

    @Override
    public Page<LeaveRequestHistoryResponse> findLeaveRequestHistoriesByDeptIdAndYearMonth(
            Long deptId,
            YearMonth yearMonth,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            Pageable pageable
    ) {
        return null;
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


    public record LeaveReqHistoryFlat (
            Long empId,
            String empNo,
            String empName,
            Long draftId,
            LeaveType leaveType,
            LocalDate startAt,
            LocalDate endAt,
            Double requestedLeaveDays,
            ApprovalStatus approvalStatus
    ) {
        private LeaveRequestHistoryResponse toHistory() {
            return new LeaveRequestHistoryResponse(draftId, leaveType, startAt, endAt, requestedLeaveDays, approvalStatus.getDescription());
        }

        private LeaveRequestHistoryAndEmpInfoResponse toHistoryAndEmpInfoResponse() {
            return new LeaveRequestHistoryAndEmpInfoResponse(empId, empNo, empName, toHistory());
        }

    }
}
