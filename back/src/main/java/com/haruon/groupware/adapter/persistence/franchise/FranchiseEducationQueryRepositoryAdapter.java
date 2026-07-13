package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.franchise.required.FranchiseEducationQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import com.haruon.groupware.domain.franchise.QEducation;
import com.haruon.groupware.domain.franchise.QEducationApplication;
import com.haruon.groupware.domain.franchise.QEducationFile;
import com.haruon.groupware.domain.franchise.QFranchise;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FranchiseEducationQueryRepositoryAdapter implements FranchiseEducationQueryRepository {

    private final JPAQueryFactory query;
    private final QFranchise franchise = QFranchise.franchise;
    private final QEducation education = QEducation.education;
    private final QEducationApplication application = QEducationApplication.educationApplication;
    private final QEducationFile educationFile = QEducationFile.educationFile;

    @Override
    public List<EducationsResponse> findEducationList(LocalDateTime start, LocalDateTime end) {
        NumberExpression<Long> appliedCount = appliedCountSum();

        return query
                .select(Projections.constructor(
                        EducationsResponse.class,
                        education.id, education.educationDate, education.place, education.title,
                        isFull(appliedCount), education.isActive
                )).from(education)
                .leftJoin(education.educationApplications, application)
                .where(
                        education.educationDate.goe(start),
                        education.educationDate.lt(end)
                )
                .groupBy(education.id, education.educationDate, education.place, education.title, education.capacity, education.isActive)
                .orderBy(education.educationDate.asc(), education.id.asc())
                .fetch();
    }

    private BooleanExpression isFull(NumberExpression<Long> appliedCount) {
        return appliedCount.goe(education.capacity);
    }

    @Override
    public Optional<EducationDetailResponse> findEducationById(Long educationId) {
        NumberExpression<Long> appliedCount = appliedCountSum();
        EducationDetailResponse.EducationDetailInfo educationDetailInfo = query
                .select(Projections.constructor(
                        EducationDetailResponse.EducationDetailInfo.class,
                        education.id, education.educationDate, education.educationDate,
                        education.place, education.title, education.content, appliedCount,
                        education.capacity, education.capacity.subtract(appliedCount), education.isActive
                )).from(education)
                .leftJoin(education.educationApplications, application)
                .where(education.id.eq(educationId))
                .groupBy(
                        education.id, education.educationDate, education.place, education.title,
                        education.content, education.capacity, education.isActive
                )
                .fetchOne();

        if(educationDetailInfo == null) return Optional.empty();

        List<FileListInfo> fileListInfos = query
                .select(Projections.constructor(
                        FileListInfo.class,
                        educationFile.id, educationFile.originalName, educationFile.extension, educationFile.fileSize
                )).from(educationFile)
                .where(educationFile.education.id.eq(educationId))
                .orderBy(educationFile.id.asc())
                .fetch();

        return Optional.of(new EducationDetailResponse(educationDetailInfo, fileListInfos));
    }

    private NumberExpression<Long> appliedCountSum() {
        return application.appliedCount.sumLong().coalesce(0L);
    }

    @Override
    public Page<EducationApplicantsResponse> findApplicantsById(Long educationId, Pageable pageable) {
        Long rows = query
                .select(application.id.countDistinct())
                .from(application)
                .where(application.education.id.eq(educationId))
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<EducationApplicantsResponse> applicantsResponses = query
                .select(Projections.constructor(
                        EducationApplicantsResponse.class,
                        application.id, application.externalId,
                        franchise.id, franchise.franchiseName, franchise.contactNumber, franchise.contactEmail.email,
                        application.appliedCount, application.appliedAt
                )).from(application)
                .join(application.franchise, franchise)
                .where(application.education.id.eq(educationId))
                .orderBy(application.appliedAt.asc(), application.id.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(applicantsResponses, pageable, totalRows);
    }

    @Override
    public List<EducationsResponse> findEducationsByFranchiseId(Long franchiseId, long month) {
        NumberExpression<Long> appliedCount = appliedCountSum();
        QEducationApplication franchiseApplication = new QEducationApplication("franchiseApplication");

        return query
                .select(Projections.constructor(
                        EducationsResponse.class,
                        education.id, education.educationDate, education.place, education.title,
                        isFull(appliedCount), education.isActive
                ))
                .from(education)
                .leftJoin(education.educationApplications, application)
                .where(
                        education.educationDate.month().eq((int) month),
                        JPAExpressions.selectOne()
                                .from(franchiseApplication)
                                .where(
                                        franchiseApplication.education.id.eq(education.id),
                                        franchiseApplication.franchise.id.eq(franchiseId)
                                )
                                .exists()
                )
                .groupBy(education.id, education.educationDate, education.place, education.title, education.capacity, education.isActive)
                .orderBy(education.educationDate.asc(), education.id.asc())
                .fetch();
    }
}
