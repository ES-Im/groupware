package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.franchise.service.dto.FranchiseCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.FranchiseUpdateRequest;
import com.haruon.groupware.domain.franchise.BusinessStatus;

/**
 * 가맹점 정보를 생성/수정/관리
 */
public interface FranchiseManagement {

    long createFranchise(long registerEmpId, FranchiseCreateRequest request);

    void updateFranchise(long franchiseId, long updaterId, FranchiseUpdateRequest request);

    void updateFranchiseStatus(long franchiseId, long updaterId, BusinessStatus status);

    void updateManager(long franchiseId, long updaterId, long newManagerId);

    void updateMemo(long franchiseId, long updaterId, String memo);

    void clearMemo(long franchiseId, long updaterId);

}
