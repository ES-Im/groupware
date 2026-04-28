package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.empService.dto.EmpAdminUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpDeptManagerUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpSelfUpdateRequest;

/**
 * 사원관련 정보 등록 및 수정, 삭제
 */
public interface EmpAccountManager {
    
    void registerEmp(EmpRegisterRequest request);

    void approveRegisterByAdmin(EmpAdminUpdateRequest adminRequest);

    void updateResignedEmpByAdmin(EmpAdminUpdateRequest adminRequest);

    void updateInfoBySelf(EmpSelfUpdateRequest request);

    void updateInfoByDeptManager(EmpDeptManagerUpdateRequest request);

    void updateInfoByAdmin(EmpAdminUpdateRequest request);

    void activateEmpByAdmin(Long adminId, Long targetId);

    void deleteEmpFile(Long empId, Long fileId);

    void updateEmpFileBySelf(EmpSelfUpdateRequest request);

    void updateFileActiveStatus(EmpAdminUpdateRequest request);

    void updateFileActiveStatus(EmpSelfUpdateRequest request);
}
