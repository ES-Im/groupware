package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;

import java.util.List;

/**
 * 사원의 개인정보를 조회
 */
public interface EmpAccountRetriever {

    EmpInfoResponse retrieveEmpAccountInfo(String loginId);

    List<EmpFileInfo> retrieveEmpFilesInfo(String loginId);

    List<BelongingInfo> retrieveEmpBelongingsInfo(String loginId);

}
