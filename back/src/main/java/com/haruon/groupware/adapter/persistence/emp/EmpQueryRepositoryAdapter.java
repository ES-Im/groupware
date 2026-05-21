package com.haruon.groupware.adapter.persistence.emp;

import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpBasicInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.required.EmpQueryRepository;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.empInfo.QEmpFile;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Slf4j
@Repository
public class EmpQueryRepositoryAdapter implements EmpQueryRepository {

    private final JPAQueryFactory query;
    private final QEmp qEmp;
    private final QEmpFile eEmpFile;
    private final QEmpBelongings eEmpBelongings;

    public EmpQueryRepositoryAdapter(JPAQueryFactory queryFactory) {
        this.query = queryFactory;
        this.qEmp = QEmp.emp;
        this.eEmpFile = QEmpFile.empFile;
        this.eEmpBelongings = QEmpBelongings.empBelongings;
    }

    @Override
    public Optional<EmpInfoResponse> findEmpInfoByLoginId(String loginId) {
        EmpBasicInfo basicInfo = query
                .select(Projections.constructor(
                        EmpBasicInfo.class,
                        qEmp.empNo, qEmp.empName, qEmp.loginId, qEmp.email.email, qEmp.extensionNo
                )).from(qEmp)
                .where(qEmp.loginId.eq(loginId), qEmp.status.eq(EmpStatus.ACTIVE))
                .fetchOne();
        log.info("basicInfo = {}", basicInfo);
        
        if(basicInfo == null) return Optional.empty();

        List<EmpFileInfo> activeFileInfos = query
                .select(Projections.constructor(
                        EmpFileInfo.class,
                        eEmpFile.id,
                        eEmpFile.originalName,
                        eEmpFile.extension,
                        eEmpFile.fileType,
                        eEmpFile.isActive
                )).from(eEmpFile)
                .where(eEmpFile.emp.loginId.eq(loginId), eEmpFile.isActive.isTrue())
                .fetch();

        log.info("activeFileInfos = {}", activeFileInfos);

        List<BelongingInfo> activeBelongingInfos = query
                .select(Projections.constructor(
                        BelongingInfo.class,
                        eEmpBelongings.id,
                        eEmpBelongings.dept.deptName, eEmpBelongings.position, eEmpBelongings.isPrimary, eEmpBelongings.startAt, eEmpBelongings.endAt
                )).from(eEmpBelongings)
                .where(eEmpBelongings.emp.loginId.eq(loginId), eEmpBelongings.endAt.isNull())
                .fetch();

        log.info("activeBelongingInfos = {}", activeBelongingInfos);
        return Optional.of(new EmpInfoResponse(basicInfo, activeFileInfos, activeBelongingInfos));
    }

    @Override
    public Optional<List<EmpFileInfo>> findAllEmpFileInfosByLoginId(String loginId) {
        return Optional.ofNullable(
                query.select(Projections.constructor(
                        EmpFileInfo.class,
                        eEmpFile.id, eEmpFile.originalName, eEmpFile.extension, eEmpFile.fileType, eEmpFile.isActive)
                ).from(eEmpFile)
                 .where(eEmpFile.emp.loginId.eq(loginId))
                 .orderBy(eEmpFile.isActive.desc(), eEmpFile.createdAt.desc())
                 .fetch()
        );
    }

    @Override
    public Optional<List<BelongingInfo>> findAllEmpBelongingInfosByLoginId(String loginId) {
        return Optional.ofNullable(
                query.select(Projections.constructor(
                        BelongingInfo.class,
                                eEmpBelongings.id,
                                eEmpBelongings.dept.deptName, eEmpBelongings.position, eEmpBelongings.isPrimary, eEmpBelongings.startAt, eEmpBelongings.endAt
                )).from(eEmpBelongings)
                .where(eEmpBelongings.emp.loginId.eq(loginId))
                .orderBy(eEmpBelongings.isPrimary.desc(), eEmpBelongings.startAt.desc())
                .fetch()
        );
    }
}
