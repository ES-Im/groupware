package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * 사원 개인정보를 조회하는 Repository
 */
public interface EmpQueryRepository {

    /** 사원의 활성화된 현재 개인정보 조회*/
    Optional<EmpInfoResponse> findEmpInfoByEmpId(Long empId);

    /** 사원의 모든 개인정보파일(프로필, 전자서명) 조회*/
    Optional<List<EmpFileInfo>> findAllEmpFileInfosByEmpId(Long empId);

    /** 사원의 모든 소속정보 조회*/
    Optional<List<BelongingInfo>> findAllEmpBelongingInfosByEmpId(Long empId);

    /** 사원의 개인정보 파일 한 건 조회 */
    Optional<EmpFileInfo> findEmpFileInfoByEmpIdAndFileId(Long empId, Long fileId);

    /** 특정 부서의 사원 리스트 조회*/
    Page<EmpInfoForManagement> findEmpInfoList(@Nullable Long deptId, @Nullable EmpStatus status, @Nullable String keyword, Pageable pageable);

    /** 회원가입 후 PENDING 상태인 신규사원 리스트 조회*/
    Page<EmpBasicInfo> findNewEmpInfoList(String keyword, Pageable pageable);
}
