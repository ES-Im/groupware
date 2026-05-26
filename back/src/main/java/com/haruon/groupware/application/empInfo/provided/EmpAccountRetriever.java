package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 사원의 개인정보를 조회
 */
public interface EmpAccountRetriever {

    EmpInfoResponse retrieveEmpAccountInfo(Long empId);

    List<EmpFileInfo> retrieveEmpFilesInfo(Long empId);

    List<BelongingInfo> retrieveEmpBelongingsInfo(Long empId);

    Page<EmpInfoForManagement> retrieveEmpAccountInfoListForManagement(
            Long managerOrAdminId,
            List<BelongingInfo> belongings,
            @Nullable Long deptId,
            @Nullable EmpStatus status,
            @Nullable String keyword,
            Pageable pageable
    );


    Page<EmpBasicInfo> retrieveNewEmpInfoList(Long adminId, String keyword, Pageable pageable);
}
