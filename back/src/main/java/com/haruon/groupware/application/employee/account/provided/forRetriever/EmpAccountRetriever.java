package com.haruon.groupware.application.employee.account.provided.forRetriever;

import com.haruon.groupware.application.employee.account.service.query.dto.*;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 사원의 개인정보를 조회
 */
public interface EmpAccountRetriever {

    EmpInfoResponse retrieveEmpAccountInfo(Long empId);

    List<EmpFileListInfo> retrieveEmpFilesInfo(Long empId);

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
