package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequestBySelf;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestByDeptManager;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestByHR;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestBySelf;

/**
 * 사원관련 정보 등록 및 수정, 삭제
 */
public interface EmpAccountManager {
    
    void registerEmp(EmpRegisterRequestBySelf request);

    void approveRegisterByHR(EmpUpdateRequestByHR request);

    void updateResignedEmpByHR(EmpUpdateRequestByHR request);

    void updateInfoBySelf(EmpUpdateRequestBySelf request);

    void updateInfoByDeptManager(EmpUpdateRequestByDeptManager request);

    void updateInfoByHR(EmpUpdateRequestByHR request);

    void activateEmpByHR(Long editorId, Long targetId);

    void deleteEmpFileBySelf(Long empId, Long fileId);

    void updateEmpFileBySelf(EmpUpdateRequestBySelf request);

    void updateFileActiveStatusByHR(EmpUpdateRequestByHR request);

    void updateFileActiveStatusBySelf(EmpUpdateRequestBySelf request);
}
