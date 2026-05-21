package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;

import java.util.List;
import java.util.Optional;

/**
 * 사원 개인정보를 조회하는 Repository
 */
public interface EmpQueryRepository {

    /** 사원의 활성화된 현재 개인정보 조회*/
    Optional<EmpInfoResponse> findEmpInfoByLoginId(String loginId);

    /** 사원의 모든 개인정보파일(프로필, 전자서명) 조회*/
    Optional<List<EmpFileInfo>> findAllEmpFileInfosByLoginId(String loginId);

    /** 사원의 모든 소속정보 조회*/
    Optional<List<BelongingInfo>> findAllEmpBelongingInfosByLoginId(String loginId);

}
