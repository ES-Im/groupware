package com.haruon.groupware.adapter.persistence.draft;

import com.haruon.groupware.application.draft.required.BusinessTripDraftQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryResponse;
import com.haruon.groupware.domain.draft.QApproval;
import com.haruon.groupware.domain.draft.QBusinessTripCancelDraft;
import com.haruon.groupware.domain.draft.QBusinessTripDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Repository
public class BusinessTripDraftQueryRepositoryAdapter implements BusinessTripDraftQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp emp;
    private final QEmpBelongings empBelongings;
    private final QApproval approval;
    private final QBusinessTripDraft businessTripDraft;
    private final QBusinessTripCancelDraft businessTripCancelDraft;

    public BusinessTripDraftQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.emp = QEmp.emp;
        this.empBelongings = QEmpBelongings.empBelongings;
        this.approval = QApproval.approval;
        this.businessTripDraft = QBusinessTripDraft.businessTripDraft;
        this.businessTripCancelDraft = QBusinessTripCancelDraft.businessTripCancelDraft;
    }

    @Override
    public List<BusinessTripRequestHistoryResponse> findBusinessTripRequestHistoriesByEmpIDAndYearMonth(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    ) {
        List<BusinessTripRequestHistoryAcceptor> acceptors = query
                .select(acceptorConstructorExpression())
                .from(businessTripDraft)
                .join(businessTripDraft.approval, approval)
                .where(
                        businessTripDraft.emp.id.eq(empId),
                        isStatusEq(approvalStatus),
                        isOverlappedWithYearMonth(yearMonth),
                        cancelDraftNotExist()
                ).fetch();

        return acceptors.stream()
                .map(BusinessTripRequestHistoryAcceptor::toBusinessTripRequestHistoryResponse)
                .toList();
    }

    @Override
    public Page<BusinessTripRequestHistoryAndEmpInfoResponse> findBusinessTripRequestHistoriesByDeptIdAndYearMonth(
            Long deptId,
            YearMonth yearMonth,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            Pageable pageable
    ) {
        Long rows = query
                .select(businessTripDraft.id.countDistinct())
                .from(businessTripDraft)
                .join(businessTripDraft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(businessTripDraft.approval, approval)
                .where(
                        empBelongings.dept.id.eq(deptId),
                        empBelongings.endAt.isNull(),
                        isOverlappedWithYearMonth(yearMonth),
                        isEmpNameContains(keyword),
                        isStatusEq(approvalStatus),
                        cancelDraftNotExist()
                ).fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<Tuple> tuple = query
                .select(
                        emp.id, emp.empNo, emp.empName,
                        acceptorConstructorExpression()
                ).from(businessTripDraft)
                .join(businessTripDraft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .join(businessTripDraft.approval, approval)
                .where(
                        empBelongings.dept.id.eq(deptId),
                        empBelongings.endAt.isNull(),
                        isOverlappedWithYearMonth(yearMonth),
                        isEmpNameContains(keyword),
                        isStatusEq(approvalStatus),
                        cancelDraftNotExist()
                )
                .orderBy(
                        emp.empNo.asc(),
                        businessTripDraft.startAt.desc(),
                        businessTripDraft.id.desc()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<BusinessTripRequestHistoryAndEmpInfoAssembler> assemblers = new ArrayList<>();

        for (Tuple row : tuple) {
            Long empId = row.get(emp.id);
            String empNo = row.get(emp.empNo);
            String empName = row.get(emp.empName);

            BusinessTripRequestHistoryAcceptor history =
                    row.get(3, BusinessTripRequestHistoryAcceptor.class);

            assemblers.add(
                    new BusinessTripRequestHistoryAndEmpInfoAssembler(empId, empNo, empName, history)
            );
        }

        List<BusinessTripRequestHistoryAndEmpInfoResponse> responses = assemblers.stream()
                .map(BusinessTripRequestHistoryAndEmpInfoAssembler::toBusinessTripRequestHistoryAndEmpInfoResponse)
                .toList();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    public record BusinessTripRequestHistoryAndEmpInfoAssembler (
            Long empId,
            String empNo,
            String empName,
            BusinessTripRequestHistoryAcceptor acceptor
    ) {
        BusinessTripRequestHistoryAndEmpInfoResponse toBusinessTripRequestHistoryAndEmpInfoResponse() {

            return new BusinessTripRequestHistoryAndEmpInfoResponse(
                    empId, empNo, empName, acceptor.toBusinessTripRequestHistoryResponse()
            );
        }
    }

    public record BusinessTripRequestHistoryAcceptor(
            Long draftId,

            LocalDateTime startAt,
            LocalDateTime endAt,

            String destination,
            String purpose,

            ApprovalStatus approvalStatus
    ) {
        private String resolveApprovalStatusName(
                ApprovalStatus approvalStatus
        ) {
            return approvalStatus.getDescription();
        }

        BusinessTripRequestHistoryResponse toBusinessTripRequestHistoryResponse() {
            return new BusinessTripRequestHistoryResponse(
                   draftId,
                   startAt.toLocalDate(),
                   endAt.toLocalDate(),
                   destination,
                   purpose,
                   resolveApprovalStatusName(approvalStatus)
            );
        }
    }

    private ConstructorExpression<BusinessTripRequestHistoryAcceptor> acceptorConstructorExpression() {
        return Projections.constructor(
                BusinessTripRequestHistoryAcceptor.class,
                businessTripDraft.id,
                businessTripDraft.startAt,
                businessTripDraft.endAt,
                businessTripDraft.destination,
                businessTripDraft.purpose,
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

        return businessTripDraft.startAt.lt(nextMonthStart)
                .and(businessTripDraft.endAt.goe(monthStart));
    }

    private BooleanExpression cancelDraftNotExist() {
        return JPAExpressions
                .selectOne()
                .from(businessTripCancelDraft)
                .where(
                        businessTripCancelDraft.sourceKey.eq(businessTripDraft.sourceKey)
                )
                .notExists();
    }

}
