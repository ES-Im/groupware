package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.franchise.required.FranchiseQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import com.haruon.groupware.domain.franchise.QFranchise;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class FranchiseQueryRepositoryAdapter implements FranchiseQueryRepository {

    private final JPAQueryFactory query;
    private final QFranchise franchise = QFranchise.franchise;
    private final QEmp emp = QEmp.emp;

    @Override
    public FranchisesDetailResponse findFranchiseById(Long franchiseId) {
        FranchisesDetailResponse response = query
                .select(Projections.constructor(
                        FranchisesDetailResponse.class,
                        franchise.id, franchise.franchiseName, franchise.address,
                        franchise.ownerName, franchise.businessNumber, franchise.contactNumber,
                        franchise.contactEmail.email, franchise.businessStatus, franchise.memo,
                        franchise.emp.id, emp.empName
                ))
                .from(franchise)
                .leftJoin(franchise.emp, emp)
                .where(
                        franchise.id.eq(franchiseId)
                ).fetchOne();

        if (response == null) throw new FranchiseNotFoundException();

        return response;
    }

    @Override
    public Page<FranchisesResponse> findFranchises(
            @Nullable String keyword,
            @Nullable BusinessStatus status,
            @Nullable Long managerId,
            Pageable pageable
    ) {
        Long rows = query.select(franchise.id.countDistinct())
                .from(franchise)
                .where(
                        isKeywordContain(keyword),
                        isStatusEq(status),
                        isManagerEq(managerId)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<FranchisesResponse> responses = query
                .select(Projections.constructor(
                        FranchisesResponse.class,
                        franchise.id,
                        franchise.franchiseName,
                        franchise.address,
                        franchise.ownerName,
                        franchise.businessStatus,
                        franchise.emp.id,
                        emp.empName
                ))
                .from(franchise)
                .leftJoin(franchise.emp, emp)
                .where(
                        isKeywordContain(keyword),
                        isStatusEq(status),
                        isManagerEq(managerId)
                )
                .orderBy(franchise.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private BooleanExpression isKeywordContain(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : franchise.franchiseName.containsIgnoreCase(keyword);
    }

    private BooleanExpression isStatusEq(@Nullable BusinessStatus status) {
        return status == null
                ? null
                : franchise.businessStatus.eq(status);
    }

    private BooleanExpression isManagerEq(@Nullable Long managerId) {
        return managerId == null
                ? null
                : franchise.emp.id.eq(managerId);
    }

}
