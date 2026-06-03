package com.haruon.groupware.adapter.persistence.dept;

import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptBasicInfo;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptInfoFlat;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptMemberInfo;
import com.haruon.groupware.application.dept.required.DeptQueryRepository;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QDeptLeader;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.*;

@Slf4j
@Repository
public class DeptQueryRepositoryAdapter implements DeptQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp qEmp;
    private final QDept qDept;
    private final QDeptLeader qDeptLeader;
    private final QEmpBelongings qEmpBelongings;

    public DeptQueryRepositoryAdapter(JPAQueryFactory query) {
        this.query = query;
        this.qEmp = QEmp.emp;
        this.qDept = QDept.dept;
        this.qDeptLeader = QDeptLeader.deptLeader;
        this.qEmpBelongings = QEmpBelongings.empBelongings;
    }

    private Expression<DeptMemberInfo> deptMemberInfoExpression() {
        return Projections.constructor(
                DeptMemberInfo.class,
                qEmp.id, qEmp.empNo, qEmp.empName, qEmp.extensionNo, qEmp.email.email, qEmpBelongings.position
        );
    }

    private Expression<DeptBasicInfo> deptBasicInfoExpression() {
        return Projections.constructor(
                DeptBasicInfo.class,
                qDept.id, qDept.deptCode, qDept.deptName, qDept.isActive, qDept.parentDept.id // 조직도 응답에서 상위 부서 식별자가 필요함
        );
    }

    @Override
    public Page<DeptInfoResponse> findDeptInfoList(
            @Nullable Boolean isActive, @Nullable String keyword, Pageable pageable
    ) {
        Long size = query
                .select(qDept.id.countDistinct())
                .from(qDept)
                .where(deptNameKeywordContains(keyword), isDeptActiveEq(isActive))
                .fetchOne();

        if(size == null || size == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DeptInfoFlat> deptInfoFlats = query
                    .select(
                            Projections.constructor(DeptInfoFlat.class,
                            qDept.id, qDept.deptCode, qDept.deptName, qDept.isActive, qDept.parentDept.id, // flat DTO에서도 계층 정렬 기준을 함께 가져와야 함
                            qEmp.id, qEmp.empNo, qEmp.empName, qEmp.extensionNo, qEmp.email.email,
                            qEmpBelongings.position
                    ))
                    .from(qDept)
                    .leftJoin(qDept.deptLeaders, qDeptLeader)
                        .on(qDeptLeader.endAt.isNull())
                    .leftJoin(qDeptLeader.emp, qEmp)
                    .leftJoin(qEmp.empBelongings, qEmpBelongings)
                        .on(qEmpBelongings.dept.eq(qDept).and(qEmpBelongings.endAt.isNull()))
                    .where(deptNameKeywordContains(keyword), isDeptActiveEq(isActive))
                    .orderBy(qDept.deptCode.asc())
                .fetch();

        List<DeptInfoFlat> orderedDeptInfoFlats = sortByDeptCodeWithChildrenFirst(deptInfoFlats);
        int startIndex = (int) Math.min(pageable.getOffset(), orderedDeptInfoFlats.size());
        int endIndex = Math.min(startIndex + pageable.getPageSize(), orderedDeptInfoFlats.size());

        List<DeptInfoResponse> deptInfoResponses = new ArrayList<>();
        for (DeptInfoFlat deptInfoFlat : orderedDeptInfoFlats.subList(startIndex, endIndex)) {
            deptInfoResponses.add(DeptInfoResponse.of(deptInfoFlat));
        }

        return new PageImpl<>(deptInfoResponses, pageable, size);
    }

    @Override
    public Page<DeptMemberInfo> findDeptMembersListByDeptId(
            Long deptId, @Nullable String keyword, @Nullable Boolean isEmpActive, Pageable pageable
    ) {
        Long size = query.select(qEmp.id.countDistinct())
                .from(qEmpBelongings)
                .join(qEmpBelongings.emp, qEmp)
                .join(qEmpBelongings.dept, qDept)
                .where(empNameKeywordContains(keyword), isEmpActiveEq(isEmpActive))
                .where(qDept.id.eq(deptId), qEmpBelongings.endAt.isNull())
                .fetchOne();

        if(size == null || size == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<DeptMemberInfo> deptMemberInfos = query
                .select(deptMemberInfoExpression())
                .from(qEmpBelongings)
                .join(qEmpBelongings.emp, qEmp)
                .join(qEmpBelongings.dept, qDept)
                .where(empNameKeywordContains(keyword), isEmpActiveEq(isEmpActive))
                .where(qDept.id.eq(deptId), qEmpBelongings.endAt.isNull())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(deptMemberInfos, pageable, size);
    }

    @Override
    public Optional<DeptInfoResponse> findDeptInfoByDeptId(Long deptId) {
        return Optional.ofNullable(query
                .select(Projections.constructor(
                        DeptInfoResponse.class,
                        deptBasicInfoExpression(),
                        deptMemberInfoExpression()
                ))
                .from(qDept)
                .leftJoin(qDept.deptLeaders, qDeptLeader).on(qDeptLeader.endAt.isNull())
                .leftJoin(qDeptLeader.emp, qEmp)
                .leftJoin(qEmp.empBelongings, qEmpBelongings)
                    .on(qEmpBelongings.dept.eq(qDept).and(qEmpBelongings.endAt.isNull()))
                .where(qDept.id.eq(deptId))
            .fetchOne());
    }

    private List<DeptInfoFlat> sortByDeptCodeWithChildrenFirst(List<DeptInfoFlat> flats) {
        Map<Long, DeptInfoFlat> deptMap = new HashMap<>();
        Map<Long, List<DeptInfoFlat>> childrenMap = new HashMap<>();
        List<DeptInfoFlat> roots = new ArrayList<>();

        for (DeptInfoFlat flat : flats) {
            deptMap.put(flat.deptId(), flat);
            if (flat.parentDeptId() == null) {
                roots.add(flat);
            } else {
                childrenMap.computeIfAbsent(flat.parentDeptId(), ignored -> new ArrayList<>()).add(flat);
            }
        }

        Comparator<DeptInfoFlat> deptCodeComparator = Comparator.comparing(DeptInfoFlat::deptCode);
        roots.sort(deptCodeComparator);
        childrenMap.values().forEach(children -> children.sort(deptCodeComparator));

        List<DeptInfoFlat> ordered = new ArrayList<>();
        roots.forEach(root -> addDeptWithChildren(root, childrenMap, ordered));

        flats.stream()
                .filter(flat -> flat.parentDeptId() != null && !deptMap.containsKey(flat.parentDeptId()))
                .sorted(deptCodeComparator)
                .forEach(orphan -> addDeptWithChildren(orphan, childrenMap, ordered));

        return ordered;
    }

    private void addDeptWithChildren(
            DeptInfoFlat deptInfo,
            Map<Long, List<DeptInfoFlat>> childrenMap,
            List<DeptInfoFlat> ordered
    ) {
        ordered.add(deptInfo);
        childrenMap.getOrDefault(deptInfo.deptId(), List.of())
                .forEach(child -> addDeptWithChildren(child, childrenMap, ordered));
    }

    private BooleanExpression deptNameKeywordContains(String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : qDept.deptName.containsIgnoreCase(keyword);
    }

    private BooleanExpression empNameKeywordContains(String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : qEmp.empName.containsIgnoreCase(keyword);
    }

    private BooleanExpression isEmpActiveEq(Boolean isActive) {
        if(isActive == null) return null;
        else if(isActive) return qEmp.status.eq(EmpStatus.ACTIVE);
        else return null;
    }

    private BooleanExpression isDeptActiveEq(Boolean isActive) {
        return isActive == null ? null : qDept.isActive.eq(isActive);
    }




}
