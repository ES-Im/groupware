package com.haruon.groupware.adapter.persistence.emp;

import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.application.empInfo.required.EmpQueryRepository;
import com.haruon.groupware.domain.empInfo.*;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class EmpQueryRepositoryAdapter implements EmpQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp qEmp;
    private final QDept qDept;
    private final QEmpFile qEmpFile;
    private final QEmpBelongings qEmpBelongings;

    public EmpQueryRepositoryAdapter(JPAQueryFactory queryFactory) {
        this.query = queryFactory;
        this.qEmp = QEmp.emp;
        this.qDept = QDept.dept;
        this.qEmpFile = QEmpFile.empFile;
        this.qEmpBelongings = QEmpBelongings.empBelongings;
    }

    private Expression<EmpFileListInfo> empFileListInfoExpression() {
        return Projections.constructor(
                EmpFileListInfo.class,
                qEmpFile.id, qEmpFile.originalName, qEmpFile.extension, qEmpFile.fileSize, qEmpFile.isActive, qEmpFile.fileType
        );
    }

    @Override
    public Optional<EmpInfoResponse> findEmpInfoByEmpId(Long empId) {
        EmpBasicInfo basicInfo = query
                .select(Projections.constructor(
                        EmpBasicInfo.class,
                        qEmp.empNo, qEmp.empName, qEmp.loginId, qEmp.email.email, qEmp.extensionNo
                )).from(qEmp)
                .where(qEmp.id.eq(empId), qEmp.status.eq(EmpStatus.ACTIVE))
                .fetchOne();
        log.info("basicInfo = {}", basicInfo);
        
        if(basicInfo == null) return Optional.empty();

        List<EmpFileListInfo> activeFileInfos = query
                .select(empFileListInfoExpression())
                .from(qEmpFile)
                .where(qEmpFile.emp.id.eq(empId), qEmpFile.isActive.isTrue())
                .fetch();

        log.info("activeFileInfos = {}", activeFileInfos);

        List<BelongingInfo> activeBelongingInfos = query
                .select(Projections.constructor(
                        BelongingInfo.class,
                        qEmpBelongings.dept.id, qEmpBelongings.dept.deptCode,
                        qEmpBelongings.dept.deptName, qEmpBelongings.position, qEmpBelongings.isPrimary, qEmpBelongings.startAt, qEmpBelongings.endAt
                )).from(qEmpBelongings)
                .where(qEmpBelongings.emp.id.eq(empId), qEmpBelongings.endAt.isNull())
                .fetch();

        log.info("activeBelongingInfos = {}", activeBelongingInfos);
        return Optional.of(new EmpInfoResponse(basicInfo, activeFileInfos, activeBelongingInfos));
    }

    @Override
    public Optional<List<EmpFileListInfo>> findAllEmpFileInfosByEmpId(Long empId) {
        return Optional.ofNullable(
                query
                 .select(empFileListInfoExpression()).from(qEmpFile)
                 .where(qEmpFile.emp.id.eq(empId))
                 .orderBy(qEmpFile.isActive.desc(), qEmpFile.createdAt.desc())
                 .fetch()
        );
    }

    @Override
    public Optional<EmpFileListInfo> findEmpFileInfoByEmpIdAndFileId(Long empId, Long fileId) {
        return Optional.ofNullable(
                query
                .select(empFileListInfoExpression())
                .from(qEmpFile)
                .where(qEmpFile.emp.id.eq(empId), qEmpFile.id.eq(fileId))
                .fetchOne()
        );
    }

    @Override
    public Optional<List<BelongingInfo>> findAllEmpBelongingInfosByEmpId(Long empId) {
        return Optional.ofNullable(
                query.select(Projections.constructor(
                        BelongingInfo.class,
                                qEmpBelongings.dept.id, qEmpBelongings.dept.deptCode,
                                qEmpBelongings.dept.deptName, qEmpBelongings.position, qEmpBelongings.isPrimary, qEmpBelongings.startAt, qEmpBelongings.endAt
                )).from(qEmpBelongings)
                .where(qEmpBelongings.emp.id.eq(empId))
                .orderBy(qEmpBelongings.isPrimary.desc(), qEmpBelongings.startAt.desc())
                .fetch()
        );
    }

    @Override
    public Page<EmpInfoForManagement> findEmpInfoList(
            @Nullable Long deptId, @Nullable EmpStatus status, @Nullable String keyword, Pageable pageable
    ) {
        Long total = query
                .select(qEmp.id.countDistinct())
                .from(qEmp)
                .leftJoin(qEmp.empBelongings, qEmpBelongings)
                .leftJoin(qEmpBelongings.dept, qDept)
                .where(
                        deptIdEq(deptId),
                        statusEq(status),
                        keywordContains(keyword)
                )
                .fetchOne();

        long totalCount = total == null ? 0 : total;
        if(totalCount == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<Long> empIds = query
                .selectDistinct(qEmp.id)
                .from(qEmp)
                .leftJoin(qEmp.empBelongings, qEmpBelongings)
                .leftJoin(qEmpBelongings.dept, qDept)
                .where(
                        deptIdEq(deptId),
                        keywordContains(keyword),
                        statusEq(status)
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(qEmp.id.asc())
                .fetch();

        if(empIds.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);


        List<EmpInfoForManagementFlat> flatList = query
                .select(Projections.constructor(
                        EmpInfoForManagementFlat.class,
                        qEmp.id, qEmp.empNo, qEmp.empName, qEmp.loginId, qEmp.email.email, qEmp.extensionNo, qEmp.status, qEmp.hiredAt, qEmp.resignedAt,

                        qDept.id, qDept.deptCode, qDept.deptName,
                        qEmpBelongings.position, qEmpBelongings.isPrimary, qEmpBelongings.startAt, qEmpBelongings.endAt
                ))
                .from(qEmp)
                .leftJoin(qEmp.empBelongings, qEmpBelongings)
                .leftJoin(qEmpBelongings.dept, qDept)
                .where(qEmp.id.in(empIds))
                .orderBy(qDept.id.asc(), positionLevel().desc(), qEmp.id.asc())
                .fetch();

        Map<Long, List<SystemRoleCode>> systemRoleMap = query
                .selectFrom(qEmp)
                .where(qEmp.id.in(empIds))
                .fetch()
                .stream()
                .collect(Collectors.toMap(
                        Emp::getId,
                        emp -> emp.getSystemRoles().stream().toList()
                ));

        List<EmpInfoForManagement> empList = groupByEmp(flatList, systemRoleMap);

        return new PageImpl<>(
                empList, pageable, totalCount
        );
    }

    @Override
    public Page<EmpBasicInfo> findNewEmpInfoList(String keyword, Pageable pageable) {
        Long totalCount = query
                .selectDistinct(qEmp.id.count())
                .from(qEmp)
                .where(qEmp.status.eq(EmpStatus.PENDING))
                .fetchOne();

        totalCount = totalCount == null ? 0 : totalCount;
        if(totalCount == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<EmpBasicInfo> newEmpList = query
                .select(Projections.constructor(
                        EmpBasicInfo.class,
                        qEmp.empNo, qEmp.empName, qEmp.loginId, qEmp.email.email, blankValue()
                )).from(qEmp)
                .where(qEmp.status.eq(EmpStatus.PENDING), keywordContains(keyword))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(
                newEmpList, pageable, totalCount
        );
    }




    private List<EmpInfoForManagement> groupByEmp(
            List<EmpInfoForManagementFlat> flatList,
            Map<Long, List<SystemRoleCode>> systemRoleMap
    ) {
        return flatList.stream()
                .collect(Collectors.groupingBy(
                        EmpInfoForManagementFlat::empId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ))
                .values()
                .stream()
                .map(rows -> {
                    EmpInfoForManagementFlat first = rows.getFirst();

                    List<BelongingInfo> belongingInfos = rows.stream()
                            .filter(row -> row.deptId() != null)
                            .map(row -> new BelongingInfo(
                                    row.deptId(), row.deptCode(), row.deptName(), row.positionName(),
                                    row.isPrimary(), row.startAt(), row.endAt()
                            )).toList();

                    return new EmpInfoForManagement(
                            first.empId(), first.empNo(), first.empName(), first.loginId(), first.email(),
                            first.extensionNo(), first.status(), first.hireAt(), first.resignAt(),

                            belongingInfos,

                            systemRoleMap.getOrDefault(first.empId(), List.of())
                    );
                }).toList();
    }

    private Expression<String> blankValue() {
        return Expressions.constant("");
    }

    private BooleanExpression deptIdEq(Long deptId) {
        return deptId == null ? null : qDept.id.eq(deptId);
    }

    private BooleanExpression statusEq(EmpStatus status) {
        return status == null ? null : qEmp.status.eq(status);
    }

    private BooleanExpression keywordContains(String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : qEmp.empName.contains(keyword);
    }

    private NumberExpression<Integer> positionLevel() {
        CaseBuilder.Cases<Integer, NumberExpression<Integer>> cases = null;

        for (PositionCode positionCode : PositionCode.values()) {
            if (cases == null) {
                cases = new CaseBuilder()
                        .when(qEmpBelongings.position.eq(positionCode))
                        .then(positionCode.getLevel());
            } else {
                cases = cases
                        .when(qEmpBelongings.position.eq(positionCode))
                        .then(positionCode.getLevel());
            }
        }

        return cases == null
                ? Expressions.ZERO
                : cases.otherwise(PositionCode.NONE.getLevel());
    }



}
