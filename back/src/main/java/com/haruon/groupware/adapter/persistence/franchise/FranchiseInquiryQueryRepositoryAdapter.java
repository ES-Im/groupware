package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.franchise.required.FranchiseInquiryQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.franchise.*;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FranchiseInquiryQueryRepositoryAdapter implements FranchiseInquiryQueryRepository {

    private final JPAQueryFactory query;
    private final QFranchise franchise = QFranchise.franchise;
    private final QFranchiseInquiry inquiry = QFranchiseInquiry.franchiseInquiry;
    private final PathBuilder<FranchiseInquiry> inquiryPath = new PathBuilder<>(FranchiseInquiry.class, inquiry.getMetadata());
    private final QFranchiseInquiryAnswer answer = QFranchiseInquiryAnswer.franchiseInquiryAnswer;
    private final QEmp emp = QEmp.emp;

    @Override
    public Page<InquiriesResponse> findInquiries(
            @Nullable Boolean isAnswered,
            @Nullable Long assignedManagerId,
            @Nullable String keyword,
            @Nullable LocalDate from,
            @Nullable LocalDate to,
            @Nullable Long franchiseId,
            Pageable pageable
    ) {
        Long rows = query
                .select(inquiry.id.countDistinct())
                .from(inquiry)
                .join(inquiry.franchise, franchise)
                .leftJoin(inquiry.emp, emp)
                .leftJoin(inquiry.answer, answer)
                .where(
                        isAnswered(isAnswered),
                        eqAssignedEmpId(assignedManagerId),
                        containKeywordOnTitle(keyword),
                        isBefore(from),
                        isAfter(to),
                        eqFranchiseId(franchiseId)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<InquiriesResponse> inquiriesResponses = query
                .select(Projections.constructor(
                        InquiriesResponse.class,
                        inquiry.id, inquiry.externalId,
                        franchise.id, franchise.franchiseName,
                        inquiry.inquiryTitle, inquiry.inquiryAt,
                        answer.answeredAt.isNotNull(),
                        emp.id, emp.empName,
                        isDeleted()
                ))
                .from(inquiry)
                .join(inquiry.franchise, franchise)
                .leftJoin(inquiry.emp, emp)
                .leftJoin(inquiry.answer, answer)
                .where(
                        isAnswered(isAnswered),
                        eqAssignedEmpId(assignedManagerId),
                        containKeywordOnTitle(keyword),
                        isBefore(from),
                        isAfter(to),
                        eqFranchiseId(franchiseId)
                )
                .orderBy(inquiry.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(inquiriesResponses, pageable, totalRows);
    }

    @Override
    public Optional<InquireDetailResponse> findInquiryById(Long inquiryId) {
        return Optional.ofNullable(
                query
                        .select(Projections.constructor(
                                InquireDetailResponse.class,
                                inquiry.id, inquiry.externalId,
                                franchise.id, franchise.franchiseName,
                                inquiry.inquirerContact, inquiry.inquiryAt,
                                inquiry.inquiryTitle, inquiry.inquiryContent,
                                emp.id, emp.empName,
                                isDeleted()
                        )).from(inquiry)
                        .join(inquiry.franchise, franchise)
                        .leftJoin(inquiry.emp, emp)
                        .where(
                                inquiry.id.eq(inquiryId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<AnswerResponse> findAnswerByInquiryId(Long inquiryId) {
        return Optional.ofNullable(
                query
                        .select(Projections.constructor(
                                AnswerResponse.class,
                                answer.id, answer.content, answer.answeredAt.isNotNull(), answer.answeredAt,
                                emp.id, emp.empName
                        ))
                        .from(answer)
                        .join(answer.inquiry, inquiry)
                        .leftJoin(inquiry.emp, emp)
                        .where(answer.inquiry.id.eq(inquiryId))
                        .fetchOne()
        );
    }



    private BooleanExpression isAnswered(@Nullable Boolean isAnswered) {
        if(isAnswered == null) return null;

        return isAnswered.equals(true)
                ? answer.answeredAt.isNotNull()
                : answer.id.isNull().or(answer.answeredAt.isNull());
    }

    private BooleanExpression isDeleted() {
        return Expressions.booleanTemplate(
                "{0} = " + InquiryType.class.getName() + ".DELETION",
                inquiry.inquiryStatus
        );
    }

    private BooleanExpression eqAssignedEmpId(@Nullable Long assignedManagerId) {
        return assignedManagerId != null
                ? inquiry.emp.id.eq(assignedManagerId)
                : null;
    }

    private BooleanExpression eqFranchiseId(@Nullable Long franchiseId) {
        return franchiseId != null
                ? inquiry.franchise.id.eq(franchiseId)
                : null;
    }

    private BooleanExpression containKeywordOnTitle(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : inquiry.inquiryTitle.containsIgnoreCase(keyword);
    }

    private BooleanExpression isBefore(@Nullable LocalDate from) {
        if(from == null) return null;

        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);

        return inquiry.inquiryAt.goe(start);
    }

    private BooleanExpression isAfter(@Nullable LocalDate to) {
        if(to == null) return null;

        LocalDateTime end = LocalDateTime.of(to, LocalTime.MIN).plusDays(1);

        return inquiry.inquiryAt.lt(end);
    }

}
