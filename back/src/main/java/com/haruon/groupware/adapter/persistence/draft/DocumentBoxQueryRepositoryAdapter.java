package com.haruon.groupware.adapter.persistence.draft;

import com.haruon.groupware.application.draft.required.DocumentBoxQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.domain.draft.QApproval;
import com.haruon.groupware.domain.draft.QApprover;
import com.haruon.groupware.domain.draft.QCirculation;
import com.haruon.groupware.domain.draft.QDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLSubQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DocumentBoxQueryRepositoryAdapter implements DocumentBoxQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp emp;
    private final QEmpBelongings empBelongings;
    private final QApproval approval;
    private final QDraft draft;
    private final QApprover approver;
    private final QCirculation circulation;

    public DocumentBoxQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.emp = QEmp.emp;
        this.empBelongings = QEmpBelongings.empBelongings;
        this.approval = QApproval.approval;
        this.draft = QDraft.draft1;
        this.approver = QApprover.approver1;
        this.circulation = QCirculation.circulation;
    }

    @Override
    public Page<DocumentBoxResponse> findSubmittedDraftsByEmpId(Long empId, @Nullable String keyword, Pageable pageable) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .where(
                        draft.emp.id.eq(empId),
                        keywordContains(keyword),
                        draft.submittedAt.isNotNull()
                ).fetchOne();

        long totalRow = rows == null? 0 : rows;
        if(totalRow == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DocumentBoxResponse> responses = query
                .select(documentBoxResponseConstructorExpression(true))
                .from(draft)
                .join(draft.approval, approval)
                .where(
                        draft.emp.id.eq(empId),
                        keywordContains(keyword),
                        draft.submittedAt.isNotNull()
                )
                .orderBy(draft.submittedAt.desc(), draft.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRow);
    }

    @Override
    public Page<DocumentBoxResponse> findUnSubmittedDraftsByEmpId(Long empId, @Nullable String keyword, Pageable pageable) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .where(
                        draft.emp.id.eq(empId),
                        keywordContains(keyword),
                        draft.submittedAt.isNull()
                ).fetchOne();

        long totalRow = rows == null? 0 : rows;
        if(totalRow == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DocumentBoxResponse> responses = query
                .select(documentBoxResponseConstructorExpression(false))
                .from(draft)
                .join(draft.approval, approval)
                .where(
                        draft.emp.id.eq(empId),
                        keywordContains(keyword),
                        draft.submittedAt.isNull()
                )
                .orderBy(draft.createdAt.desc(), draft.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRow);
    }

    @Override
    public Page<DocumentBoxResponse> findPendingApprovalDraftsByEmpId(Long empId, @Nullable String keyword, Pageable pageable) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .join(draft.approval, approval)
                .where(
                        keywordContains(keyword),
                        draft.id.in(currentApprovalTurnDraftIdsByEmpId(empId))
                ).fetchOne();

        long totalRow = rows == null? 0 : rows;
        if(totalRow == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DocumentBoxResponse> responses = query
                .select(
                        documentBoxResponseConstructorExpression(false)
                ).from(draft)
                .join(draft.approval, approval)
                .where(
                        keywordContains(keyword),
                        draft.id.in(currentApprovalTurnDraftIdsByEmpId(empId))
                )
                .orderBy(draft.submittedAt.desc(), draft.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRow);
    }



    @Override
    public Page<DocumentBoxResponse> findAccessibleDraftsByEmpId(
            Long empId,
            List<Long> deptIds,
            @Nullable String keyword,
            Pageable pageable
    ) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .leftJoin(draft.circulations, circulation)
                .join(draft.approval, approval)
                .join(approval.approvers, approver)
                .join(draft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .where(
                        empBelongings.dept.id.in(deptIds).and(approval.status.eq(ApprovalStatus.APPROVED))
                                .or(circulation.viewer.id.eq(empId).and(approval.status.eq(ApprovalStatus.APPROVED)))
                                .or(approver.approver.id.eq(empId)),
                        empBelongings.endAt.isNull(),
                        approval.status.eq(ApprovalStatus.APPROVED),
                        keywordContains(keyword)
                )
                .fetchOne();

        long totalRow = rows == null? 0 : rows;
        if(totalRow == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DocumentBoxResponse> responses = query
                .selectDistinct(documentBoxResponseConstructorExpression(false))
                .from(draft)
                .leftJoin(draft.circulations, circulation)
                .join(draft.approval, approval)
                .join(approval.approvers, approver)
                .join(draft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .where(
                        empBelongings.dept.id.in(deptIds).and(approval.status.eq(ApprovalStatus.APPROVED))
                            .or(circulation.viewer.id.eq(empId).and(approval.status.eq(ApprovalStatus.APPROVED)))
                            .or(approver.approver.id.eq(empId)),
                        empBelongings.endAt.isNull(),
                        approval.status.eq(ApprovalStatus.APPROVED),
                        keywordContains(keyword)
                ).orderBy(draft.submittedAt.desc(), draft.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRow);
    }

    @Override
    public Long countPendingApprovalDraftsByEmpId(Long empId) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .where(
                        draft.id.in(currentApprovalTurnDraftIdsByEmpId(empId))
                ).fetchOne();

        return rows == null? 0L : rows;
    }

    @Override
    public Long countUnSubmittedDraftsByEmpId(Long empId) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .where(
                        draft.emp.id.eq(empId),
                        draft.submittedAt.isNull()
                ).fetchOne();

        return rows == null ? 0L : rows;
    }

    @Override
    public Long countSubmittedDraftsByEmpId(Long empId) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .where(
                        draft.emp.id.eq(empId),
                        draft.submittedAt.isNotNull()
                ).fetchOne();

        return rows == null ? 0L : rows;
    }

    @Override
    public Long countAccessibleDraftsByEmpId(Long empId, List<Long> deptIds) {
        Long rows = query
                .select(draft.id.countDistinct())
                .from(draft)
                .leftJoin(draft.circulations, circulation)
                .join(draft.approval, approval)
                .join(approval.approvers, approver)
                .join(draft.emp, emp)
                .join(emp.empBelongings, empBelongings)
                .where(
                        empBelongings.dept.id.in(deptIds).and(approval.status.eq(ApprovalStatus.APPROVED))
                                .or(circulation.viewer.id.eq(empId).and(approval.status.eq(ApprovalStatus.APPROVED)))
                                .or(approver.approver.id.eq(empId)),
                        empBelongings.endAt.isNull(),
                        approval.status.eq(ApprovalStatus.APPROVED)
                )
                .fetchOne();

        return rows == null ? 0L : rows;
    }

    private BooleanExpression keywordContains(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : draft.title.containsIgnoreCase(keyword);
    }

    private ConstructorExpression<DocumentBoxResponse> documentBoxResponseConstructorExpression(boolean isAvailableRejectedDraft) {
        return Projections.constructor(
                DocumentBoxResponse.class,
                draft.id,
                draft.emp.empName,
                draft.title,
                draft.submittedAt,
                latestApproverNameExpression(isAvailableRejectedDraft),
                isFileAttachedExpression(),
                approval.status
        );
    }

    private Expression<Boolean> isFileAttachedExpression() {
        return draft.draftFiles.isNotEmpty();
    }

    private JPQLSubQuery<String> latestApproverNameExpression(boolean isAvailableRejectedDraft) {
        QEmp latestApproverEmp = new QEmp("latestApproverEmp");
        QApprover outerApprover = new QApprover("outerApprover");
        QApprover innerApprover = new QApprover("innerApprover");

        return JPAExpressions
                .select(latestApproverEmp.empName)
                .from(outerApprover)
                .join(outerApprover.approver, latestApproverEmp)
                .where(
                        outerApprover.approval.eq(approval),
                        processedApprovalCondition(outerApprover, isAvailableRejectedDraft),
                        outerApprover.order.eq(
                                JPAExpressions
                                        .select(innerApprover.order.max())
                                        .from(innerApprover)
                                        .where(
                                                innerApprover.approval.eq(approval),
                                                processedApprovalCondition(innerApprover, isAvailableRejectedDraft)
                                        )
                        )
                );
        /*
        select e.emp_name
          from draft outer_draft
          join approval outer_approval on ap.draft_id = outer_draft.id
          join approver outer_approver on ar.approval_id = outer_approval.id
          join emp e on e.id = ar.approver_id
         where outer_approver.order = (select max(inner_approver.order)
                                         from approver inner_approver
                                        where inner_approver.approval_id = outer_approval.id and (
                                              inner_approver.approved_at is not null
                                              or inner_approver.rejected_at is not null
                                              )
                                         )
         */
    }

    private JPQLSubQuery<Long> currentApprovalTurnDraftIdsByEmpId(long empId) {
        QDraft turnDraft = new QDraft("turnDraft");
        QApproval outerApproval = new QApproval("outerApproval");
        QApprover outerApprover = new QApprover("outerApprover");
        QApprover innerApprover = new QApprover("innerApprover");

        return JPAExpressions
                .select(turnDraft.id)
                .from(turnDraft)
                .join(turnDraft.approval, outerApproval)
                .join(outerApproval.approvers, outerApprover)
                .where(
                        outerApprover.order.eq(
                                JPAExpressions
                                        .select(innerApprover.order.min())
                                        .from(innerApprover)
                                        .where(
                                                innerApprover.approval.eq(outerApproval),
                                                innerApprover.approvedAt.isNull(),
                                                innerApprover.rejectedAt.isNull()
                                        )
                        ),
                        outerApproval.status.in(ApprovalStatus.WAITING, ApprovalStatus.IN_PROGRESS),
                        outerApprover.approvedAt.isNull(),
                        outerApprover.rejectedAt.isNull(),
                        outerApprover.approver.id.eq(empId)
                );


    /*
     * select d.draftId
     *   from draft d
     *   join approval outer_approval on d.id = outer_approval.draftId
     *   join approver outer_approver on outer_approval.id = outer_approver.approvalId
     *   join emp e on outer_approver.empId = e.id
     *  where outer_approver.order
     *       = (select min(inner_approver.order)
     *            from approver inner_approver
     *           where outer_approver.approvalId = inner_approver.approvalId
     *             and inner_approver.approved_at is Null
     *             and inner_approver.rejected_at is Null)
     *        and outer_approval.status in (WAITING, IN_PROGRESS)
     *        and e.id == :id
     */
    }


    private BooleanExpression processedApprovalCondition(QApprover innerApprover, boolean isAvailableRejectedDraft) {
        if(isAvailableRejectedDraft) {
            return innerApprover.approvedAt.isNotNull().or(
                    innerApprover.rejectedAt.isNotNull()
            );
        } else {
            return innerApprover.approvedAt.isNotNull();
        }
    }
}
